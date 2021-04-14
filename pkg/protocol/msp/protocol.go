package msp

import (
	"errors"
	"io"

	"github.com/BossHobby/configurator/pkg/controller"
	"github.com/BossHobby/configurator/pkg/util"
	"github.com/sirupsen/logrus"
)

const (
	mspHeaderLen = byte(5)

	MSPApiVersion byte = 1 //out message
	MSPFcVariant  byte = 2 //out message
	MSPFcVersion  byte = 3 //out message
	MSPBoardInfo  byte = 4 //out message
	MSPBuildInfo  byte = 5 //out message

	MSP4wayIf byte = 245 //out message
)

var (
	ErrShortWrite       = errors.New("short write")
	ErrShortRead        = errors.New("short read")
	ErrInvalidMagic     = errors.New("invalid magic")
	ErrInvalidDirection = errors.New("invalid direction")
	ErrInvalidCommand   = errors.New("invalid cmd")
	ErrInvalidChecksum  = errors.New("invalid checksum")

	log = logrus.WithField("protocol", "msp")
)

type MSPProtocol struct {
	rw io.ReadWriter
}

func NewMSPProtocol(rw io.ReadWriter) (*MSPProtocol, error) {
	p := &MSPProtocol{
		rw: rw,
	}
	return p, nil
}

func (p *MSPProtocol) Close() error {
	return nil
}

func (p *MSPProtocol) read() ([]byte, error) {
	buf := make([]byte, mspHeaderLen)

	length, err := p.rw.Read(buf)
	if err != nil {
		return nil, err
	}

	if buf[0] != '$' || buf[1] != 'M' {
		log.Printf("% x (%s)", buf[:length], string(buf[:length]))
		return nil, ErrInvalidMagic
	}

	if buf[2] != '>' {
		log.Printf("% x (%s)", buf[:length], string(buf[:length]))
		return nil, ErrInvalidDirection
	}

	payloadLen, cmd := buf[3], buf[4]
	size := int(mspHeaderLen + payloadLen + 1)

	payload, err := util.ReadAtLeast(p.rw, int(payloadLen)+1)
	if err != nil {
		return nil, err
	}
	length += len(payload)

	if length != size {
		log.Printf("% x (%s)", buf[:length], string(buf[:length]))
		return nil, ErrShortRead
	}

	crc := util.UpdateCRC8(0, buf[3:])
	crc = util.UpdateCRC8(crc, payload[:payloadLen])

	if crc != payload[payloadLen] {
		return nil, ErrInvalidChecksum
	}

	log.Printf("received cmd: %d size: %d", cmd, payloadLen)

	return payload[:payloadLen], nil
}

func (p *MSPProtocol) Send(cmd byte) ([]byte, error) {
	buf := []byte{
		'$',
		'M',
		'<',
		0,
		cmd,
	}
	buf = append(buf, util.UpdateCRC8(0, buf[3:]))

	n, err := p.rw.Write(buf)
	if err != nil {
		return nil, err
	}
	if n < len(buf) {
		return nil, ErrShortWrite
	}

	return p.read()
}

func (p *MSPProtocol) Detect() bool {
	buf, err := p.Send(MSPFcVariant)
	if err != nil {
		return false
	}
	return string(buf) != "QUIC"
}

func (p *MSPProtocol) Info() (*controller.ControllerInfo, error) {
	buf, err := p.Send(MSPBoardInfo)
	if err != nil {
		return nil, err
	}

	nameOffset := 9 + buf[8]
	nameLength := buf[nameOffset]

	return &controller.ControllerInfo{
		Type:   "Betaflight",
		Target: string(buf[nameOffset+1 : nameOffset+1+nameLength]),
	}, nil
}
