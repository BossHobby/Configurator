package controller

import (
	"fmt"
	"log"

	"github.com/NotFastEnuf/configurator/controller/protocol"
	serial "github.com/bugst/go-serial"
)

type Controller struct {
	PortName string
	Port     serial.Port
}

func OpenController(serialPort string) (*Controller, error) {
	mode := &serial.Mode{
		BaudRate: 115200,
	}
	port, err := serial.Open(serialPort, mode)
	if err != nil {
		return nil, err
	}
	return &Controller{
		PortName: serialPort,
		Port:     port,
	}, nil
}

func (c *Controller) Run() error {
	buf := make([]byte, 1)
	n, err := c.Port.Read(buf)
	if err != nil {
		return err
	}
	if n != 1 {
		return nil
	}

	switch buf[0] {
	case '#':
		if err := protocol.ReadQUIC(c.Port); err != nil {
			return err
		}
	default:
		fmt.Print(string(buf))
	}
	return nil
}

func (c *Controller) Close() error {
	return c.Port.Close()
}

func (c *Controller) ReadFlash(length uint16) []byte {
	buf := make([]byte, length)
	offset := uint16(0)

	for offset < length {
		res := protocol.SendBlheli(c.Port, protocol.BLHeliCmdDeviceRead, offset, []byte{128})
		log.Printf("<blheli> readFlash %d (%d)\n", offset, len(res.PARAMS))
		copy(buf[offset:], res.PARAMS)
		offset += uint16(len(res.PARAMS))
	}

	return buf
}

func (c *Controller) WriteFlash(buf []byte) {
	offset, length := uint16(0), uint16(len(buf))

	for offset < length {
		size := length - offset
		if size > 128 {
			size = 128
		}
		res := protocol.SendBlheli(c.Port, protocol.BLHeliCmdDeviceWrite, offset, buf[offset:offset+size])
		log.Printf("<blheli> writeFlash ack: %d offset: %d (%d)\n", res.ACK, offset, size)
		offset += size
	}
}
