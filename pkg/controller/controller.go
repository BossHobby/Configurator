package controller

import (
	"errors"
	"io"
	"runtime"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
	serial "go.bug.st/serial"
)

var (
	defaultTimeout = 5 * time.Second
	ErrTimeout     = errors.New("timeout")
)

type Controller struct {
	io.ReadWriteCloser

	PortName   string
	Disconnect chan error

	port serial.Port

	readErrorChan chan error
	readChan      chan byte

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
	mode := &serial.Mode{}

	if runtime.GOOS == "darwin" {
		mode.BaudRate = 230400
	} else {
		mode.BaudRate = 921600
	}

	port, err := serial.Open(serialPort, mode)
	if err != nil {
		return nil, err
	}

	c := &Controller{
		PortName:   serialPort,
		Disconnect: make(chan error, 10),

		port:          port,
		readErrorChan: make(chan error, 0),
		readChan:      make(chan byte, 64),
	}

	go c.readLoop()

	return c, nil
}

func (c *Controller) readLoop() {
	p := make([]byte, 512)

	for {
		n, err := c.port.Read(p)
		if err != nil {
			c.readErrorChan <- err
			c.Disconnect <- err
			return
		}
		if n == 0 {
			c.readErrorChan <- io.EOF
			c.Disconnect <- io.EOF
			return
		}
		log.Tracef("read %d bytes %q", n, p[:n])
		for _, b := range p[:n] {
			c.readChan <- b
		}
	}
}

func (c *Controller) Read(p []byte) (int, error) {
	n := 0
	for {
		select {
		case b := <-c.readChan:
			p[n] = b
			n++
			if n == len(p) {
				return n, nil
			}
		case <-time.After(defaultTimeout):
			return n, ErrTimeout
		case err := <-c.readErrorChan:
			return n, err
		}
	}
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
		return n, io.EOF
	}
	log.Tracef("wrote %d bytes %q", n, p[:n])
	return n, err
}

func (c *Controller) Flush() error {
	flush := make([]byte, 1)
	for {
		n, err := c.Read(flush)
		if err != nil {
			if err == ErrTimeout {
				break
			}
			return err
		}
		if n == 0 {
			break
		}
	}
	return nil
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
