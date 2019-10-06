package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	_ "github.com/NotFastEnuf/configurator/cmd/server/statik"
	"github.com/NotFastEnuf/configurator/controller"
	"github.com/fxamacker/cbor"
	"github.com/gorilla/mux"
	"github.com/rakyll/statik/fs"
)

func renderJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Fatal(err)
	}
}

func loggingMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v\n", r.Method, r.URL.Path, time.Since(start))
	})
}

func spaHandler() http.HandlerFunc {
	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		const indexFile = "/index.html"

		upath := r.URL.Path
		if !strings.HasPrefix(upath, "/") {
			upath = "/" + upath
			r.URL.Path = upath
		}

		f, err := statikFS.Open(path.Clean(upath))
		if err != nil && !os.IsNotExist(err) {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if os.IsNotExist(err) {
			f, err = statikFS.Open(indexFile)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		stat, err := f.Stat()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if stat.IsDir() {
			f, err = statikFS.Open(indexFile)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Cache-Control", "max-age=30")
		w.Header().Set("Cache-Control", "max-age=30")
		http.ServeContent(w, r, stat.Name(), time.Now(), f)
	}
}

func setupRoutes(r *mux.Router) {
	r.Use(loggingMidleware)

	r.HandleFunc("/api/connect", func(w http.ResponseWriter, r *http.Request) {
		serialPort := "defaultPort"
		if err := json.NewDecoder(r.Body).Decode(&serialPort); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := connecController(serialPort); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/disconnect", func(w http.ResponseWriter, r *http.Request) {
		closeController()
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := controller.Profile{}
		if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, value)
	}).Methods("GET")

	r.HandleFunc("/api/default_profile", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := controller.Profile{}
		if err := fc.GetQUIC(controller.QuicValDefaultProfile, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, value)
	}).Methods("GET")

	r.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		profile := controller.Profile{}
		if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := fc.SetQUIC(controller.QuicValProfile, &profile); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, profile)
	}).Methods("POST")

	r.HandleFunc("/api/profile/download", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := controller.Profile{}
		if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		filename := "Profile_" + strings.Replace(value.Meta.Name, "\x00", "", -1) + "_" + time.Unix(int64(value.Meta.Datetime), 0).Format("2006-01-02") + ".cbor"
		w.Header().Set("Content-Disposition", "attachment; filename="+filename)
		w.Header().Set("Content-Type", "application/octet-stream")
		if err := cbor.NewEncoder(w, cbor.EncOptions{}).Encode(value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}).Methods("GET")

	r.HandleFunc("/api/profile/upload", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			fmt.Println(err)
			return
		}
		defer file.Close()

		value := controller.Profile{}
		if err := cbor.NewDecoder(file).Decode(&value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if err := fc.SetQUIC(controller.QuicValProfile, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, value)
	}).Methods("POST")

	r.HandleFunc("/api/blackbox/rate", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := 0
		if err := fc.GetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, value)
	}).Methods("GET")

	r.HandleFunc("/api/blackbox/rate", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := 0
		if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		log.Println(value)
		if err := fc.SetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, value)
	}).Methods("POST")

	r.HandleFunc("/api/cal_imu", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		_, err := fc.SendQUIC(controller.QuicCmdCalImu, []byte{})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/ws", websocketHandler)
	r.PathPrefix("/").HandlerFunc(spaHandler())
}
