package main

import (
	"errors"
	"net/http"
	"reflect"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/BossHobby/configurator/pkg/controller"
	"github.com/BossHobby/configurator/pkg/dfu"
	"github.com/BossHobby/configurator/pkg/firmware"
	"github.com/BossHobby/configurator/pkg/protocol"
	"github.com/BossHobby/configurator/pkg/protocol/msp"
	"github.com/BossHobby/configurator/pkg/protocol/quic"
	_ "github.com/BossHobby/configurator/pkg/statik"

	"github.com/gorilla/mux"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
	serial "go.bug.st/serial"
)

type Status struct {
	Version        string
	Port           string
	AvailablePorts []string
	Info           *quic.TargetInfo
	IsConnected    bool
	HasDFU         bool
	HasUpdate      bool
}

type Server struct {
	autoConnect bool
	status      Status

	fl *firmware.FirmwareLoader

	fcMu sync.Mutex
	fc   *controller.Controller
	qp   *quic.QuicProtocol

	info *quic.TargetInfo

	fs http.FileSystem

	dfuMu     sync.Mutex
	dfuLoader *dfu.Loader
	updater   *Updater
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
		fl:      fl,
		fs:      statikFS,
		updater: NewUpdater(),
	}, nil
}

func (s *Server) Close() {
	s.closeController()
}

func (s *Server) broadcastQuic(qp *quic.QuicProtocol) {
	for msg := range qp.Log {
		broadcastWebsocket("log", msg)
	}
}

func (s *Server) connectController(port string) (*controller.ControllerInfo, error) {
	log.Printf("opening controller %s", port)
	c, err := controller.OpenController(port)
	if err != nil {
		return nil, err
	}

	go func(fc *controller.Controller) {
		log.Warnf("port: %v", <-c.Disconnect)
		log.Printf("closing controller %s", port)
		s.closeController()
	}(c)

	proto := protocol.Detect(c)

	switch proto {
	case protocol.ProtocolQuic:
		p, err := quic.NewQuicProtocol(c)
		if err != nil {
			c.Close()
			return nil, err
		}
		info, err := p.TargetInfo()
		if err != nil {
			c.Close()
			return nil, err
		}

		go s.broadcastQuic(p)

		s.fcMu.Lock()
		defer s.fcMu.Unlock()

		s.fc = c
		s.qp = p
		s.info = info
		return p.Info()
	case protocol.ProtocolMSP:
		defer c.Close()

		p, err := msp.NewMSPProtocol(c)
		if err != nil {
			return nil, err
		}
		defer p.Close()

		return p.Info()
	default:
		c.Close()
		return nil, errors.New("invalid protocol")
	}
}

func (s *Server) connectFirstController() (*controller.ControllerInfo, error) {
	return s.connectController(s.status.AvailablePorts[0])
}

func (s *Server) controllerStatus() (*Status, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}

	s.fcMu.Lock()
	defer s.fcMu.Unlock()

	status := &Status{
		Version:        version,
		AvailablePorts: ports,
		IsConnected:    s.fc != nil,
		HasDFU:         s.dfuLoader != nil,
		HasUpdate:      s.updater.found,
	}
	if runtime.GOOS == "darwin" {
		status.AvailablePorts = make([]string, 0)
		for _, p := range ports {
			if !strings.HasPrefix("/dev/cu", p) {
				status.AvailablePorts = append(status.AvailablePorts, p)
			}
		}
	} else {
		status.AvailablePorts = ports
	}

	if s.fc != nil {
		status.Port = s.fc.PortName
		status.Info = s.info
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

	s.fcMu.Lock()
	defer s.fcMu.Unlock()

	if s.fc != nil {
		log.Debug("closing fc")
		if err := s.qp.Close(); err != nil {
			log.Error(err)
		}
		if err := s.fc.Close(); err != nil {
			log.Error(err)
		}
	}
	s.fc = nil
}

func (s *Server) watchPorts() {
	interval := time.NewTicker(250 * time.Millisecond)
	for {
		<-interval.C

		cs, err := s.controllerStatus()
		if err != nil {
			log.Error("controllerStatus:", err)
			continue
		}

		if s.fc == nil && len(cs.AvailablePorts) != 0 && s.autoConnect {
			if _, err = s.connectController(cs.AvailablePorts[0]); err != nil {
				log.Error(err)
			}
			s.autoConnect = false
		}

		if !reflect.DeepEqual(*cs, s.status) {
			broadcastWebsocket("status", cs)
		}
		s.status = *cs

		if s.status.IsConnected && s.status.Info.QuicProtocolVersion > 1 {
			var state quic.State
			if err := s.qp.GetValue(quic.QuicValState, &state); err != nil {
				log.Error(err)
				continue
			}
			broadcastWebsocket("state", state)

			if s.status.Info.Features != nil && ((*s.status.Info.Features)&quic.FeatureDebug != 0) {
				perf := make([]quic.PerfCounter, 0)
				if err := s.qp.GetValue(quic.QuicValPerfCounters, &perf); err != nil {
					log.Error(err)
					continue
				}
				broadcastWebsocket("perf_counters", perf)
			}
		}
	}
}

func (s *Server) Serve() {
	log.Printf("Starting Quicksilver Configurator %s", version)

	r := mux.NewRouter()
	s.setupRoutes(r)

	go s.updater.Check(version)
	go s.watchPorts()

	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
