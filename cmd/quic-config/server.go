package main

import (
	"net/http"
	"reflect"
	"sync"
	"time"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/NotFastEnuf/configurator/pkg/firmware"
	serial "github.com/bugst/go-serial"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
)

type Status struct {
	IsConnected    bool
	HasDFU         bool
	Port           string
	AvailablePorts []string
	Info           *controller.TargetInfo
}

type Server struct {
	autoConnect bool
	status      Status

	fl *firmware.FirmwareLoader
	fc *controller.Controller

	dfuMu     sync.Mutex
	dfuLoader *dfu.Loader
}

func NewServer() (*Server, error) {
	fl, err := firmware.NewFirmwareLoader(cacheDir(), githubToken)
	if err != nil {
		return nil, err
	}
	return &Server{
		fl: fl,
	}, nil
}

func (s *Server) Close() {
	s.closeController()
}

func (s *Server) connectController(p string) error {
	log.Printf("opening controller %s", p)
	c, err := controller.OpenController(p)
	if err != nil {
		return err
	}
	s.fc = c

	go func(fc *controller.Controller) {
		log.Warnf("port: %v", <-c.Disconnect)
		log.Printf("closing controller %s", p)
		s.closeController()
	}(c)

	return nil
}

func (s *Server) connectFirstController() error {
	return s.connectController(s.status.AvailablePorts[0])
}

func (s *Server) controllerStatus() (*Status, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}

	status := &Status{
		AvailablePorts: ports,
		IsConnected:    s.fc != nil,
		HasDFU:         s.dfuLoader != nil,
	}
	if s.fc != nil {
		status.Port = s.fc.PortName
		status.Info = s.fc.Info
	}
	return status, nil
}

func (s *Server) closeController() {
	if s.dfuLoader != nil {
		if err := s.dfuLoader.Close(); err != nil {
			log.Error(err)
		}
		for {
			time.Sleep(750 * time.Millisecond)
			d, err := dfu.NewLoader()
			if err != nil {
				break
			}
			d.Close()
		}
	}
	s.dfuLoader = nil

	if s.fc != nil {
		if err := s.fc.Close(); err != nil {
			log.Error(err)
		}
	}
	s.fc = nil
}

func broadcastQuic() {
	for {
		select {
		case msg := <-controller.QuicLog:
			broadcastWebsocket("log", msg)
		case msg := <-controller.QuicBlackbox:
			broadcastWebsocket("blackbox", msg)
		}
	}
}

func (s *Server) watchPorts() {
	interval := 500 * time.Millisecond
	for {
		cs, err := s.controllerStatus()
		if err != nil {
			log.Error("controllerStatus:", err)
			time.Sleep(interval)
			continue
		}

		if s.fc != nil && len(cs.AvailablePorts) == 0 {
			s.closeController()
		}
		if s.fc == nil && len(cs.AvailablePorts) != 0 && s.autoConnect {
			if err = s.connectController(cs.AvailablePorts[0]); err != nil {
				log.Error(err)
				continue
			}
			s.autoConnect = false
		}

		if !reflect.DeepEqual(*cs, s.status) {
			broadcastWebsocket("status", cs)
		}
		s.status = *cs
		time.Sleep(interval)
	}
}

func (s *Server) Serve() {
	log.Printf("Starting Quicksilver Configurator %s", version)

	r := mux.NewRouter()
	s.setupRoutes(r)

	go s.watchPorts()
	go broadcastQuic()

	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
