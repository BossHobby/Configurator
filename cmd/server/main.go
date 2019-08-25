//go:generate statik -src=../../web/dist

package main

import (
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/NotFastEnuf/configurator/cmd/server/statik"
	"github.com/NotFastEnuf/configurator/controller"
	"github.com/NotFastEnuf/configurator/controller/protocol"
	serial "github.com/bugst/go-serial"
	"github.com/fxamacker/cbor"
	"github.com/gorilla/mux"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
)

var (
	defaultPort = "/dev/ttyACM0"
	fc          *controller.Controller
	disconnect  = make(chan bool, 1)
)

type Status struct {
	IsConnected    bool
	Port           string
	AvailablePorts []string
}

func renderJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Fatal(err)
	}
}

func connecController(p string) error {
	log.Printf("opening controller %s\n", p)
	c, err := controller.OpenController(p)
	if err != nil {
		log.Printf("opening controller: %v\n", err)
		return err
	}

	go func(fc *controller.Controller) {
		for {
			select {
			case <-disconnect:
				log.Printf("closing controller %s\n", p)
				fc.Close()
				return
			default:
				if err := fc.Run(); err != nil {
					log.Printf("port: %v\n", err)
					disconnect <- true
				}
			}
		}
	}(c)

	fc = c

	return nil
}

func closeController() {
	fc.Close()
	fc = nil
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
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
		renderJSON(w, s)
	}).Methods("GET")

	r.HandleFunc("/api/connect", func(w http.ResponseWriter, r *http.Request) {
		connecController(defaultPort)
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/disconnect", func(w http.ResponseWriter, r *http.Request) {
		closeController()
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/rx", func(w http.ResponseWriter, r *http.Request) {
		buf := protocol.SendQUIC(fc.Port, 1, []byte{2})

		value := new(map[string][]float32)
		if err := cbor.Unmarshal(buf, value); err != nil {
			log.Fatal(err)
		}
		renderJSON(w, *value)
	}).Methods("GET")

	r.HandleFunc("/api/vbat", func(w http.ResponseWriter, r *http.Request) {
		buf := protocol.SendQUIC(fc.Port, 1, []byte{3})

		value := new(map[string]float32)
		if err := cbor.Unmarshal(buf, value); err != nil {
			log.Fatal(err)
		}
		renderJSON(w, *value)
	}).Methods("GET")

	r.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		buf := protocol.SendQUIC(fc.Port, 1, []byte{1})

		value := controller.Profile{}
		if err := cbor.Unmarshal(buf, &value); err != nil {
			log.Fatal(err)
		}
		renderJSON(w, value)
	}).Methods("GET")

	r.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		profile := controller.Profile{}
		if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
			log.Fatal(err)
		}

		data, err := cbor.Marshal(profile, cbor.EncOptions{
			Canonical: true,
		})
		if err != nil {
			log.Fatal(err)
		}

		res := protocol.SendQUIC(fc.Port, 2, append([]byte{1}, data...))
		if err := cbor.Unmarshal(res, &profile); err != nil {
			log.Fatal(err)
		}
		renderJSON(w, profile)
	}).Methods("POST")

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}
	r.PathPrefix("/").Handler(http.FileServer(statikFS))

	connecController(defaultPort)
	http.ListenAndServe(":8000", cors.Default().Handler(r))
}
