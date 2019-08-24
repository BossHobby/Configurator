package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/NotFastEnuf/configurator/controller"
	"github.com/NotFastEnuf/configurator/controller/protocol"
	"github.com/fxamacker/cbor"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

var (
	fc *controller.Controller
)

func renderJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Fatal(err)
	}
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		if fc != nil {
			renderJSON(w, "CONNECTED")
		} else {
			renderJSON(w, "DISCONNECTED")
		}
	}).Methods("GET")

	r.HandleFunc("/api/connect", func(w http.ResponseWriter, r *http.Request) {
		c, err := controller.OpenController("/dev/ttyACM0")
		if err != nil {
			log.Fatal(err)
		}
		fc = c

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
		log.Printf("profile: %+v\n", profile)

		data, err := cbor.Marshal(profile, cbor.EncOptions{
			Canonical: true,
		})
		if err != nil {
			log.Fatal(err)
		}

		res := protocol.SendQUIC(fc.Port, 2, append([]byte{1}, data...))
		value := controller.Profile{}
		if err := cbor.Unmarshal(res, &value); err != nil {
			log.Fatal(err)
		}
		log.Printf("profile: %+v\n", value)
		renderJSON(w, value)
	}).Methods("POST")

	c, err := controller.OpenController("/dev/ttyACM0")
	if err != nil {
		log.Fatal(err)
	}
	defer c.Close()

	fc = c
	go fc.Run()

	http.ListenAndServe(":8000", cors.Default().Handler(r))
}
