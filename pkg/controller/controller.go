package controller

import (
	"errors"
	"io"
	"sync"

	log "github.com/sirupsen/logrus"
	serial "go.bug.st/serial"
)

type Controller struct {
	io.ReadWriteCloser

	PortName   string
	Disconnect chan error

	port    serial.Port
	muRead  sync.Mutex
	muWrite sync.Mutex
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
		//BaudRate: 115200,
		BaudRate: 921600,
	}
	port, err := serial.Open(serialPort, mode)
	if err != nil {
		return nil, err
	}

	c := &Controller{
		PortName:   serialPort,
		port:       port,
		Disconnect: make(chan error, 1),
	}
	return c, nil
}

func (c *Controller) Read(p []byte) (int, error) {
	c.muRead.Lock()
	defer c.muRead.Unlock()

	n, err := c.port.Read(p)
	if err != nil {
		c.Disconnect <- err
		return n, err
	}
	if n == 0 {
		c.Disconnect <- io.EOF
		return n, err
	}

	log.Tracef("n %d bytes %q", n, p[:n])
	return n, nil
}

func (c *Controller) Write(p []byte) (int, error) {
	c.muWrite.Lock()
	defer c.muWrite.Unlock()

	n, err := c.port.Write(p)
	if err != nil {
		c.Disconnect <- err
		return n, err
	}
	if n == 0 {
		c.Disconnect <- io.EOF
		return n, err
	}
	log.Tracef("wrote %d bytes %q", n, p[:n])
	return n, err
}

func (c *Controller) Close() error {
	if c.port != nil {
		return c.port.Close()
	}
	return nil
}

func (c *Controller) SoftReboot() {
	c.Write([]byte{'S'})
}

func (c *Controller) HardReboot() {
	c.Write([]byte{'R'})
}
