package main

import (
	"net/http"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/firmware"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
)

type Server struct {
	fl *firmware.FirmwareLoader
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

func (s *Server) Serve() {
	log.Printf("Starting Quicksilver Configurator %s", version)

	r := mux.NewRouter()
	s.setupRoutes(r)

	go watchPorts()
	go broadcastQuic()

	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
