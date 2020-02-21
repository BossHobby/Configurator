package controller

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/fxamacker/cbor/v2"
)

type QuicCommand uint8

const (
	QuicCmdInvalid QuicCommand = iota
	QuicCmdGet
	QuicCmdSet
	QuicCmdLog
	QuicCmdCalImu
	QuicCmdBlackbox
)

const (
	QuicFlagNone = iota
	QuicFlagError
	QuicFlagStreaming
)

type QuicValue uint8

const (
	QuicValInvalid QuicValue = iota
	QuicValInfo
	QuicValProfile
	QuicValDefaultProfile
	QuicValBlackboxRate
	QuicValPidRatePresets
	QuicValVtxSettings
	QuicValOSDFont
)

type QuicPacket struct {
	cmd  QuicCommand
	flag uint8
	len  uint16

	Payload io.Reader
}

const quicHeaderLen = uint16(4)

var quicChannel = make(map[QuicCommand]chan QuicPacket)

var QuicLog = make(chan string, 100)
var QuicBlackbox = make(chan interface{}, 100)

func (c *Controller) ReadQUIC() error {
	header, err := c.readAtLeast(int(quicHeaderLen - 1))
	if err != nil {
		return err
	}

	packet := QuicPacket{
		cmd:  QuicCommand(header[0] & (0xff >> 3)),
		flag: (header[0] >> 5),
		len:  uint16(header[1])<<8 | uint16(header[2]),
	}

	r, w := io.Pipe()
	packet.Payload = r

	if packet.cmd != QuicCmdBlackbox {
		log.Debugf("<quic> received cmd: %d flag: %d len: %d", packet.cmd, packet.flag, packet.len)
	}

	errorChan := make(chan error)

	go func() {
		switch packet.cmd {
		case QuicCmdLog:
			val := new(string)
			if err := cbor.NewDecoder(packet.Payload).Decode(val); err != nil {
				errorChan <- err
				return
			}
			log.Debugf("<quic> log %s", *val)
			QuicLog <- *val
			break
		case QuicCmdBlackbox:
			val := new(Blackbox)
			if err := cbor.NewDecoder(packet.Payload).Decode(val); err != nil {
				errorChan <- err
				return
			}
			QuicBlackbox <- *val
			break
		default:
			select {
			case quicChannel[packet.cmd] <- packet:
			default:
			}
		}
		errorChan <- nil
	}()

	if packet.flag&QuicFlagStreaming != 0 {
		buf := make([]byte, 2048)
		for {
			n, err := c.port.Read(buf)
			if err != nil {
				if err == io.EOF {
					break
				}
				return err
			}
			log.Debugf("read %d bytes %q", n, buf[:n])
			if n == 0 {
				break
			}
			w.Write(buf[:n])
		}
	} else {
		_, err := io.CopyN(w, c.port, int64(packet.len))
		if err != nil {
			return err
		}
	}

	return <-errorChan
}

func (c *Controller) SendQUIC(cmd QuicCommand, data []byte) (*QuicPacket, error) {
	buf := []byte{
		'#',
		byte(cmd),
		byte((len(data) >> 8) & 0xFF),
		byte(len(data) & 0xFF),
	}
	buf = append(buf, data...)

	log.Debugf("<quic> sent cmd: %d len: %d", cmd, len(data))

	if quicChannel[cmd] == nil {
		quicChannel[cmd] = make(chan QuicPacket)
	}
	c.writeChannel <- buf

	select {
	case p := <-quicChannel[cmd]:
		if p.flag == QuicFlagError {
			var msg string
			if err := cbor.NewDecoder(p.Payload).Decode(&msg); err != nil {
				return nil, err
			}
			return nil, errors.New(msg)
		}
		return &p, nil
	case <-time.After(60 * time.Second):
		return nil, errors.New("quic recive timeout")
	}
}

func (c *Controller) GetQUICReader(typ QuicValue) (io.Reader, error) {
	req, err := cbor.Marshal(typ)
	if err != nil {
		return nil, err
	}

	p, err := c.SendQUIC(QuicCmdGet, req)
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

func (c *Controller) GetQUIC(typ QuicValue, v interface{}) error {
	r, err := c.GetQUICReader(typ)
	if err != nil {
		return err
	}

	if err := cbor.NewDecoder(r).Decode(v); err != nil {
		return err
	}

	return nil
}

func (c *Controller) SetQUIC(typ QuicValue, v interface{}) error {
	req := new(bytes.Buffer)

	enc := cbor.NewEncoder(req)
	if err := enc.Encode(&typ); err != nil {
		return err
	}
	if err := enc.Encode(v); err != nil {
		return err
	}

	p, err := c.SendQUIC(QuicCmdSet, req.Bytes())
	if err != nil {
		return err
	}

	var inTyp QuicValue
	dec := cbor.NewDecoder(p.Payload)
	if err := dec.Decode(&inTyp); err != nil {
		return err
	}
	if typ != inTyp {
		return fmt.Errorf("typ (%d) != inTyp (%d)", typ, inTyp)
	}

	if err := dec.Decode(v); err != nil {
		return err
	}

	return nil
}

func (c *Controller) SetQUICReader(typ QuicValue, r io.Reader, v interface{}) error {
	req := new(bytes.Buffer)

	enc := cbor.NewEncoder(req)
	if err := enc.Encode(&typ); err != nil {
		return err
	}

	if _, err := io.Copy(req, r); err != nil {
		return err
	}

	p, err := c.SendQUIC(QuicCmdSet, req.Bytes())
	if err != nil {
		return err
	}

	var inTyp QuicValue
	dec := cbor.NewDecoder(p.Payload)
	if err := dec.Decode(&inTyp); err != nil {
		return err
	}
	if typ != inTyp {
		return fmt.Errorf("typ (%d) != inTyp (%d)", typ, inTyp)
	}

	if err := dec.Decode(v); err != nil {
		return err
	}

	return nil
}
