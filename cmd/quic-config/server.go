package main

import (
	"net/http"
	"reflect"
	"sync"
	"time"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/NotFastEnuf/configurator/pkg/firmware"
	"github.com/NotFastEnuf/configurator/pkg/quic"
	_ "github.com/NotFastEnuf/configurator/pkg/statik"
	"github.com/gorilla/mux"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
	serial "go.bug.st/serial"
)

type Status struct {
	IsConnected    bool
	HasDFU         bool
	Port           string
	AvailablePorts []string
	Info           *quic.TargetInfo
}

type Server struct {
	autoConnect bool
	status      Status

	fl *firmware.FirmwareLoader
	fc *controller.Controller
	qp *quic.QuicProtocol

	fs http.FileSystem

	dfuMu     sync.Mutex
	dfuLoader *dfu.Loader
}

func NewServer() (*Server, error) {
	fl, err := firmware.NewFirmwareLoader(cacheDir(), githubToken)
	if err != nil {
		return nil, err
	}
	statikFS, err := fs.New()
	if err != nil {
		return nil, err
	}
	return &Server{
		fl: fl,
		fs: statikFS,
	}, nil
}

func (s *Server) Close() {
	s.closeController()
}

func (s *Server) broadcastQuic(qp *quic.QuicProtocol) {
	for {
		select {
		case msg := <-qp.Log:
			broadcastWebsocket("log", msg)
		case msg := <-qp.Blackbox:
			broadcastWebsocket("blackbox", msg)
		}
	}
}

func (s *Server) connectController(port string) error {
	log.Printf("opening controller %s", port)
	c, err := controller.OpenController(port)
	if err != nil {
		return err
	}

	go func(fc *controller.Controller) {
		log.Warnf("port: %v", <-c.Disconnect)
		log.Printf("closing controller %s", port)
		s.closeController()
	}(c)

	p, err := quic.NewQuicProtocol(c)
	if err != nil {
		c.Close()
		return err
	}

	go s.broadcastQuic(p)

	s.fc = c
	s.qp = p

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
		status.Info = s.qp.Info
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
		log.Debug("closing fc")
		if err := s.fc.Close(); err != nil {
			log.Error(err)
		}
	}
	s.fc = nil
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

	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
