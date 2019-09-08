package main

import (
	"log"

	"github.com/NotFastEnuf/configurator/controller"
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

func controllerStatus() Status {
	ports, err := serial.GetPortsList()
	if err != nil {
		log.Fatal(err)
	}
	if fc != nil && len(ports) == 0 {
		closeController()
	}

	s := Status{
		AvailablePorts: ports,
		IsConnected:    fc != nil,
	}
	if fc != nil {
		s.Port = fc.PortName
	}
	return s
}

func closeController() {
	if fc != nil {
		fc.Close()
	}
	fc = nil
}

func connecController(p string) error {
	log.Printf("opening controller %s\n", p)
	c, err := controller.OpenController(p)
	if err != nil {
		log.Printf("opening controller: %v\n", err)
		return err
	}

	go func(fc *controller.Controller) {
		if err := fc.Run(); err != nil {
			log.Printf("port: %v\n", err)
			disconnect <- true
		}
	}(c)

	go func(fc *controller.Controller) {
		<-disconnect
		log.Printf("closing controller %s\n", p)
		closeController()
	}(c)

	fc = c

	value := new(map[string]interface{})
	if err := fc.GetQUIC(controller.QuicValInfo, value); err != nil {
		closeController()
		return err
	}
	return nil
}
