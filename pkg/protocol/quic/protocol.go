package quic

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"sync"

	"github.com/BossHobby/configurator/pkg/controller"
	"github.com/BossHobby/configurator/pkg/util"
	"github.com/fxamacker/cbor/v2"
	"github.com/sirupsen/logrus"
)

var (
	ErrShortWrite     = errors.New("short write")
	ErrShortRead      = errors.New("short read")
	ErrInvalidMagic   = errors.New("invalid magic")
	ErrInvalidCommand = errors.New("invalid cmd")

	errUpdatePacket = errors.New("update packet")

	log = logrus.WithField("protocol", "quic")
)

type opts struct {
	timeout bool
	reader  io.Reader
	value   []interface{}
}

func Opts() opts {
	return opts{
		timeout: true,
		reader:  nil,
		value:   make([]interface{}, 0),
	}
}

func (o opts) WithTimeout(t bool) opts {
	o.timeout = t
	return o
}

func (o opts) WithReader(r io.Reader) opts {
	o.reader = r
	return o
}

func (o opts) WithValue(v ...interface{}) opts {
	o.value = v
	return o
}

type QuicProtocol struct {
	Log chan string

	info *TargetInfo
	rw   io.ReadWriter

	packetMu sync.Mutex
}

func NewQuicProtocol(rw io.ReadWriter) (*QuicProtocol, error) {
	p := &QuicProtocol{
		Log: make(chan string, 100),

		rw: rw,
	}
	return p, nil
}

func (p *QuicProtocol) TargetInfo() (*TargetInfo, error) {
	info := new(TargetInfo)
	if err := p.GetValue(QuicValInfo, info); err != nil {
		return nil, err
	}
	p.info = info
	return info, nil
}

func (p *QuicProtocol) Info() (*controller.ControllerInfo, error) {
	if p.info == nil {
		if _, err := p.TargetInfo(); err != nil {
			return nil, err
		}
	}

	return &controller.ControllerInfo{
		Type:   "Quicksilver",
		Target: p.info.TargetName,
	}, nil
}

func (p *QuicProtocol) Detect() bool {
	if _, err := p.TargetInfo(); err != nil {
		return false
	}
	return true
}

func (proto *QuicProtocol) Close() error {
	close(proto.Log)
	return nil
}

func (proto *QuicProtocol) readHeader() (*QuicPacket, error) {
	magic := make([]byte, 1)
	for {
		n, err := proto.rw.Read(magic)
		if err != nil {
			return nil, err
		}
		if n == 0 {
			continue
		}
		if magic[0] == '#' {
			break
		}
		log.Warnf("invalid magic %q", magic)
		return nil, ErrInvalidMagic
	}

	header, err := util.ReadAtLeast(proto.rw, int(quicHeaderLen-1))
	if err != nil {
		return nil, err
	}

	return &QuicPacket{
		cmd:  QuicCommand(header[0] & (0xff >> 3)),
		flag: (header[0] >> 5),
		len:  uint16(header[1])<<8 | uint16(header[2]),
	}, nil
}

func (proto *QuicProtocol) readPacket(o opts) (*QuicPacket, error) {
	p, err := proto.readHeader()
	if err != nil {
		if err == controller.ErrTimeout && !o.timeout {
			return nil, errUpdatePacket
		}
		return nil, err
	}

	if p.cmd >= QuicCmdMax || p.cmd == QuicCmdInvalid {
		return nil, ErrInvalidCommand
	}

	if p.cmd != QuicCmdBlackbox {
		log.Debugf("recv cmd: %d flag: %d len: %d", p.cmd, p.flag, p.len)
	}

	r, w := io.Pipe()
	bw := bufio.NewWriter(w)
	if p.flag == QuicFlagStreaming {
		if _, err := io.CopyN(bw, proto.rw, int64(p.len)); err != nil {
			return nil, err
		}
		p.Payload = r
	} else {
		b := new(bytes.Buffer)
		for b.Len() != int(p.len) {
			n, err := io.CopyN(b, proto.rw, int64(p.len)-int64(b.Len()))
			if err != nil {
				if err == io.EOF {
					continue
				}
				return nil, err
			}
			if n == 0 {
				return nil, ErrShortRead
			}
		}
		p.Payload = ioutil.NopCloser(b)
	}

	switch {
	case p.cmd == QuicCmdLog:
		val := new(string)
		if err := cbor.NewDecoder(p.Payload).Decode(val); err != nil {
			return nil, err
		}
		log.Debugf("log %s", *val)
		select {
		case proto.Log <- *val:
		default:
		}
		return nil, errUpdatePacket
	case (proto.info == nil || proto.info.QuicProtocolVersion == 1) && p.cmd == QuicCmdBlackbox:
		val := new(interface{})
		if err := cbor.NewDecoder(p.Payload).Decode(val); err != nil {
			log.Error("error reading blackbox", err)
			return nil, errUpdatePacket
		}
		return nil, errUpdatePacket
	default:
		break
	}

	if p.flag == QuicFlagStreaming {
		go func() {
			defer proto.packetMu.Unlock()

			for {
				h, err := proto.readHeader()
				if err != nil {
					if err == controller.ErrTimeout {
						continue
					}
					log.Panic(err)
				}
				if h.len == 0 {
					bw.Flush()
					w.Close()
					break
				}
				log.Tracef("stream cmd: %d flag: %d len: %d", h.cmd, h.flag, h.len)
				if _, err := io.CopyN(bw, proto.rw, int64(h.len)); err != nil {
					log.Panic(err)
				}
			}
		}()
	} else {
		defer proto.packetMu.Unlock()
	}

	if p.flag == QuicFlagExit {
		proto.Close()
	}

	return p, nil
}

func (proto *QuicProtocol) read(o opts) (*QuicPacket, error) {
	for {
		p, err := proto.readPacket(o)
		if err != nil {
			if err == errUpdatePacket {
				continue
			}
			return nil, err
		}
		return p, nil
	}
}

func (proto *QuicProtocol) Send(cmd QuicCommand, o opts) (*QuicPacket, error) {
	if len(o.value) > 0 {
		buf := new(bytes.Buffer)

		enc := cbor.NewEncoder(buf)
		for _, v := range o.value {
			if err := enc.Encode(v); err != nil {
				return nil, err
			}
		}

		o = o.WithReader(buf)
	}

	data, err := ioutil.ReadAll(o.reader)
	if err != nil {
		return nil, err
	}

	buf := bytes.NewBuffer([]byte{
		'#',
		byte(cmd),
		byte((len(data) >> 8) & 0xFF),
		byte(len(data) & 0xFF),
	})
	if _, err := buf.Write(data); err != nil {
		return nil, err
	}

	proto.packetMu.Lock()

	if _, err := io.Copy(proto.rw, buf); err != nil {
		proto.packetMu.Unlock()
		return nil, err
	}
	if buf.Len() != 0 {
		proto.packetMu.Unlock()
		return nil, ErrShortWrite
	}

	log.Debugf("sent cmd: %d len: %d", cmd, len(data))

	p, err := proto.read(o)
	if err != nil {
		proto.packetMu.Unlock()
		return nil, err
	}

	if p.flag == QuicFlagError {
		var msg string
		if err := cbor.NewDecoder(p.Payload).Decode(&msg); err != nil {
			return nil, err
		}
		return nil, errors.New(msg)
	}
	return p, nil
}

func (proto *QuicProtocol) Get(typ QuicValue) (io.ReadCloser, error) {
	p, err := proto.Send(QuicCmdGet, Opts().WithValue(typ))
	if err != nil {
		return nil, err
	}

	dec := cbor.NewDecoder(io.LimitReader(p.Payload, 1))

	var inTyp QuicValue
	if err := dec.Decode(&inTyp); err != nil {
		return nil, err
	}
	if typ != inTyp {
		return nil, fmt.Errorf("typ (%d) != inTyp (%d)", typ, inTyp)
	}

	return p.Payload, nil
}

func (proto *QuicProtocol) GetValue(typ QuicValue, v interface{}) error {
	r, err := proto.Get(typ)
	if err != nil {
		return err
	}

	if err := cbor.NewDecoder(r).Decode(v); err != nil {
		return err
	}

	return nil
}

func (proto *QuicProtocol) Set(typ QuicValue, r io.Reader) (io.ReadCloser, error) {
	buf := new(bytes.Buffer)

	enc := cbor.NewEncoder(buf)
	if err := enc.Encode(typ); err != nil {
		return nil, err
	}

	if _, err := io.Copy(buf, r); err != nil {
		return nil, err
	}

	p, err := proto.Send(QuicCmdSet, Opts().WithReader(buf))
	if err != nil {
		return nil, err
	}

	dec := cbor.NewDecoder(io.LimitReader(p.Payload, 1))

	var inTyp QuicValue
	if err := dec.Decode(&inTyp); err != nil {
		return nil, err
	}
	if typ != inTyp {
		return nil, fmt.Errorf("typ (%d) != inTyp (%d)", typ, inTyp)
	}

	return p.Payload, nil
}

func (proto *QuicProtocol) SetValue(typ QuicValue, v interface{}) error {
	buf := new(bytes.Buffer)
	if err := cbor.NewEncoder(buf).Encode(v); err != nil {
		return err
	}

	r, err := proto.Set(typ, buf)
	if err != nil {
		return err
	}

	if err := cbor.NewDecoder(r).Decode(v); err != nil {
		return err
	}

	return nil
}
