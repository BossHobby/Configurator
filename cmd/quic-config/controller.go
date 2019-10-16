package main

import (
	"errors"
	"reflect"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	serial "github.com/bugst/go-serial"
)

var (
	disconnect = make(chan bool, 1)
)

type Status struct {
	IsConnected    bool
	Port           string
	AvailablePorts []string
}

func controllerStatus() (*Status, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}
	if fc != nil && len(ports) == 0 {
		closeController()
	}

	s := &Status{
		AvailablePorts: ports,
		IsConnected:    fc != nil,
	}
	if fc != nil {
		s.Port = fc.PortName
	}
	return s, nil
}

func closeController() {
	if fc != nil {
		fc.Close()
	}
	fc = nil
}

func connectFirstController() error {
	ports, err := serial.GetPortsList()
	if err != nil {
		return err
	}

	if len(ports) == 0 {
		return errors.New("no controller port found")
	}

	return connectController(ports[0])
}

func connectController(p string) error {
	log.Printf("opening controller %s\n", p)
	c, err := controller.OpenController(p)
	if err != nil {
		return err
	}

	go func(fc *controller.Controller) {
		if err := fc.Run(); err != nil {
			log.Warnf("port: %v\n", err)
			disconnect <- true
		}
	}(c)

	go func(fc *controller.Controller) {
		<-disconnect
		log.Printf("closing controller %s\n", p)
		closeController()
	}(c)

	// try 10 times to get sync
	for i := 0; i < 10; i++ {
		value := new(map[string]interface{})
		err = c.GetQUIC(controller.QuicValInfo, value)
		if err == nil {
			break
		}
	}

	if err != nil {
		closeController()
		return err
	}

	fc = c
	return nil
}

func watchPorts() {
	for {
		s, err := controllerStatus()
		if err != nil {
			log.Println(err)
			time.Sleep(500 * time.Millisecond)
			continue
		}

		if !reflect.DeepEqual(*s, status) {
			broadcastWebsocket("status", s)
		}
		status = *s
		time.Sleep(500 * time.Millisecond)
	}
}
