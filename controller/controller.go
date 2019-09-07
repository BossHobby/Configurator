package controller

import (
	"fmt"
	"log"

	serial "github.com/bugst/go-serial"
)

type Controller struct {
	PortName string

	port         serial.Port
	writeChannel chan []byte
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
		PortName:     serialPort,
		port:         port,
		writeChannel: make(chan []byte),
	}, nil
}

func (c *Controller) Run() error {
	go func() {
		for {
			buf := <-c.writeChannel
			if _, err := c.port.Write(buf); err != nil {
				return
			}
		}
	}()

	buf := make([]byte, 1)
	for {
		n, err := c.port.Read(buf)
		if err != nil {
			return err
		}
		if n != 1 {
			continue
		}

		switch buf[0] {
		case '#':
			if err := c.ReadQUIC(); err != nil {
				return err
			}
		default:
			fmt.Print(string(buf))
		}
	}
	return nil
}

func (c *Controller) Close() error {
	return c.port.Close()
}

func (c *Controller) ReadFlash(length uint16) []byte {
	buf := make([]byte, length)
	offset := uint16(0)

	for offset < length {
		res := c.SendBlheli(BLHeliCmdDeviceRead, offset, []byte{128})
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
		res := c.SendBlheli(BLHeliCmdDeviceWrite, offset, buf[offset:offset+size])
		log.Printf("<blheli> writeFlash ack: %d offset: %d (%d)\n", res.ACK, offset, size)
		offset += size
	}
}

func (c *Controller) readAtLeast(size int) ([]byte, error) {
	length := 0

	buf := make([]byte, size)
	for length != size {
		n, err := c.port.Read(buf[length:size])
		if err != nil {
			return nil, err
		}
		length += n
	}

	return buf, nil
}
