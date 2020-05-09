package quic

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"time"

	"github.com/NotFastEnuf/configurator/pkg/util"
	"github.com/fxamacker/cbor/v2"
	log "github.com/sirupsen/logrus"
)

var (
	ErrShortWrite     = errors.New("short write")
	ErrShortRead      = errors.New("short read")
	ErrInvalidMagic   = errors.New("invalid magic")
	ErrInvalidCommand = errors.New("invalid cmd")
	ErrTimeout        = errors.New("timeout")

	errUpdatePacket = errors.New("update packet")
)

type quicTicket struct {
	cmd QuicCommand
}

type QuicProtocol struct {
	Info *TargetInfo

	rw io.ReadWriter

	stopChan chan interface{}
	errChan  chan error

	ticketChan chan quicTicket
	packetChan chan *QuicPacket

	Blackbox chan Blackbox
	Log      chan string
}

func NewQuicProtocol(rw io.ReadWriter) (*QuicProtocol, error) {
	p := &QuicProtocol{
		rw: rw,

		stopChan:   make(chan interface{}),
		errChan:    make(chan error),
		ticketChan: make(chan quicTicket, 100),
		packetChan: make(chan *QuicPacket, 100),

		Blackbox: make(chan Blackbox, 100),
		Log:      make(chan string, 100),
	}

	go func() {
		for {
			select {
			case <-p.stopChan:
				return
			default:
				_, err := p.readPacket()
				if err != nil {
					if err == errUpdatePacket || err == ErrInvalidMagic || err == io.EOF {
						continue
					}
					select {
					case p.errChan <- err:
					default:
					}
					continue
				}
			}

		}
	}()

	info, err := p.sync()
	if err != nil {
		return nil, err
	}
	p.Info = info

	return p, nil
}

func (proto *QuicProtocol) Close() {
	close(proto.stopChan)
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
		continue
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

func (proto *QuicProtocol) readPacket() (*QuicPacket, error) {
	p, err := proto.readHeader()
	if err != nil {
		return nil, err
	}

	if p.cmd != QuicCmdBlackbox {
		log.Debugf("<quic> recv cmd: %d flag: %d len: %d", p.cmd, p.flag, p.len)
	}

	if p.cmd == QuicCmdInvalid || p.cmd >= QuicCmdMax {
		<-proto.ticketChan
		return nil, ErrInvalidCommand
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
		log.Debugf("<quic> log %s", *val)
		select {
		case proto.Log <- *val:
		default:
		}
		return nil, errUpdatePacket
	case p.cmd == QuicCmdBlackbox && p.flag != QuicFlagStreaming:
		val := new(Blackbox)
		if err := cbor.NewDecoder(p.Payload).Decode(val); err != nil {
			log.Error("error reading blackbox", err)
			return nil, errUpdatePacket
		}
		select {
		case proto.Blackbox <- *val:
		default:
		}
		return nil, errUpdatePacket
	default:
		ticket := <-proto.ticketChan
		if p.cmd != ticket.cmd {
			return nil, ErrInvalidCommand
		}
		proto.packetChan <- p
		break
	}

	if p.flag == QuicFlagStreaming {
		for {
			h, err := proto.readHeader()
			if err != nil {
				return nil, err
			}
			if h.len == 0 {
				bw.Flush()
				w.Close()
				break
			}

			if _, err := io.CopyN(bw, proto.rw, int64(h.len)); err != nil {
				return nil, err
			}
		}
	}

	if p.flag == QuicFlagExit {
		proto.Close()
	}

	return p, nil
}

func (proto *QuicProtocol) Read() (*QuicPacket, error) {
	select {
	case p := <-proto.packetChan:
		return p, nil
	case err := <-proto.errChan:
		return nil, err
	case <-time.After(60 * time.Second):
		<-proto.ticketChan
		return nil, ErrTimeout
	}
}

func (proto *QuicProtocol) Send(cmd QuicCommand, r io.Reader) (*QuicPacket, error) {
	data, err := ioutil.ReadAll(r)
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

	if _, err := io.Copy(proto.rw, buf); err != nil {
		return nil, err
	}
	if buf.Len() != 0 {
		return nil, ErrShortWrite
	}

	log.Debugf("<quic> sent cmd: %d len: %d", cmd, len(data))

	proto.ticketChan <- quicTicket{cmd}
	p, err := proto.Read()
	if err != nil {
		return nil, err
	}
	if p.cmd != cmd {
		return nil, ErrInvalidCommand
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

func (proto *QuicProtocol) SendValue(cmd QuicCommand, val ...interface{}) (*QuicPacket, error) {
	buf := new(bytes.Buffer)

	enc := cbor.NewEncoder(buf)
	for _, v := range val {
		if err := enc.Encode(v); err != nil {
			return nil, err
		}
	}

	return proto.Send(cmd, buf)
}

func (proto *QuicProtocol) Get(typ QuicValue) (io.ReadCloser, error) {
	p, err := proto.SendValue(QuicCmdGet, typ)
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

	p, err := proto.Send(QuicCmdSet, buf)
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

func (proto *QuicProtocol) sync() (info *TargetInfo, err error) {
	info = new(TargetInfo)
	if err = proto.GetValue(QuicValInfo, info); err != nil {
		return nil, err
	}
	return info, nil
}
