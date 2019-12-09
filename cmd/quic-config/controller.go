package main

import (
	"errors"
	"reflect"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/dfu"
	serial "github.com/bugst/go-serial"
)

var (
	autoConnect = false
	dfuMu       sync.Mutex
	dfuLoader   *dfu.Loader
)

type Status struct {
	IsConnected    bool
	HasDFU         bool
	Port           string
	AvailablePorts []string
	Info           *controller.TargetInfo
}

func controllerStatus() (*Status, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}
	if fc != nil && len(ports) == 0 {
		closeController()
	}
	if fc == nil && len(ports) != 0 && autoConnect {
		if err := connectFirstController(); err != nil {
			return nil, err
		}
		autoConnect = false
	}

	dfuMu.Lock()
	defer dfuMu.Unlock()

	if dfuLoader == nil {
		d, err := dfu.NewLoader()
		if err != nil {
			dfuLoader = nil
			if err != dfu.ErrDeviceNotFound {
				return nil, err
			}
		} else {
			log.Debug("detected dfu")
			dfuLoader = d
		}
	}

	s := &Status{
		AvailablePorts: ports,
		IsConnected:    fc != nil,
		HasDFU:         dfuLoader != nil,
	}
	if fc != nil {
		s.Port = fc.PortName
		s.Info = fc.Info
	}
	return s, nil
}

func closeController() {
	if dfuLoader != nil {
		if err := dfuLoader.Close(); err != nil {
			log.Error(err)
		}
		for {
			d, err := dfu.NewLoader()
			if err != nil {
				break
			}
			d.Close()
		}
	}
	dfuLoader = nil

	if fc != nil {
		if err := fc.Close(); err != nil {
			log.Error(err)
		}
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

	return connectController(ports[len(ports)-1])
}

func connectController(p string) error {
	log.Printf("opening controller %s", p)
	c, err := controller.OpenController(p)
	if err != nil {
		return err
	}
	fc = c

	go func(fc *controller.Controller) {
		log.Warnf("port: %v", <-c.Disconnect)
		log.Printf("closing controller %s", p)
		closeController()
	}(c)

	return nil
}

func watchPorts() {
	interval := 1500 * time.Millisecond
	for {
		s, err := controllerStatus()
		if err != nil {
			log.Error("controllerStatus:", err)
			time.Sleep(interval)
			continue
		}

		if !reflect.DeepEqual(*s, status) {
			broadcastWebsocket("status", s)
		}
		status = *s
		time.Sleep(interval)
	}
}
