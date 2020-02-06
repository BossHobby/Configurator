package controller

import (
	"errors"
	"fmt"

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
		return nil, c.Close()
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
