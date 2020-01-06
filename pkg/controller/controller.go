package controller

import (
	"errors"
	"fmt"

	log "github.com/sirupsen/logrus"

	serial "go.bug.st/serial"
)

type Controller struct {
	PortName   string
	Info       *TargetInfo
	Disconnect chan error

	port         serial.Port
	writeChannel chan []byte
}

func OpenFirstController() (*Controller, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}

	if len(ports) == 0 {
		return nil, errors.New("no controller port found")
	}

	return OpenController(ports[len(ports)-1])
}

func OpenController(serialPort string) (*Controller, error) {
	mode := &serial.Mode{
		BaudRate: 115200,
	}
	port, err := serial.Open(serialPort, mode)
	if err != nil {
		return nil, err
	}

	c := &Controller{
		PortName:   serialPort,
		Disconnect: make(chan error, 1),
		Info:       new(TargetInfo),

		port:         port,
		writeChannel: make(chan []byte),
	}
	go func(fc *Controller) {
		if err := fc.run(); err != nil {
			fc.Disconnect <- err
		}
	}(c)

	// try 5 times to get sync
	for i := 0; i < 5; i++ {
		err = c.GetQUIC(QuicValInfo, c.Info)
		if err == nil {
			break
		}
	}
	if err != nil {
		port.Close()
		return nil, err
	}

	return c, nil
}

func (c *Controller) run() error {
	go func() {
		for buf := range c.writeChannel {
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
}

func (c *Controller) Close() error {
	return c.port.Close()
}

func (c *Controller) SoftReboot() {
	c.writeChannel <- []byte{'S'}
}

func (c *Controller) HardReboot() {
	c.writeChannel <- []byte{'R'}
}

func (c *Controller) ReadFlash(length uint16) []byte {
	buf := make([]byte, length)
	offset := uint16(0)

	for offset < length {
		res := c.SendBlheli(BLHeliCmdDeviceRead, offset, []byte{128})
		log.Printf("<blheli> readFlash %d (%d)", offset, len(res.PARAMS))
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
		log.Printf("<blheli> writeFlash ack: %d offset: %d (%d)", res.ACK, offset, size)
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
