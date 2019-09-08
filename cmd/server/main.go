//go:generate statik -f -src=../../web/dist

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"time"

	_ "github.com/NotFastEnuf/configurator/cmd/server/statik"
	"github.com/NotFastEnuf/configurator/controller"
	serial "github.com/bugst/go-serial"
	"github.com/gorilla/mux"
	"github.com/rakyll/statik/fs"
	"github.com/rs/cors"
)

var (
	fc         *controller.Controller
	disconnect = make(chan bool, 1)
	version    = "dirty"
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

	return nil
}

func openbrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Configurator running at %s!\n", url)
}

func defaultPort() string {
	switch runtime.GOOS {
	case "windows":
		return "COM13"
	default:
		return "/dev/ttyACM0"
	}
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
		serialPort := "defaultPort"
		if err := json.NewDecoder(r.Body).Decode(&serialPort); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		connecController(serialPort)
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/disconnect", func(w http.ResponseWriter, r *http.Request) {
		closeController()
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/rx", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := new(map[string]interface{})
		if err := fc.GetQUIC(controller.QuicValRx, value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, *value)
	}).Methods("GET")

	r.HandleFunc("/api/vbat", func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}

		value := new(map[string]interface{})
		if err := fc.GetQUIC(controller.QuicValVbat, value); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		renderJSON(w, *value)
	}).Methods("GET")

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

	r.PathPrefix("/").HandlerFunc(spaHandler())
}

func main() {
	log.Printf("Starting Quicksilver Configurator %s\n", version)

	r := mux.NewRouter()
	setupRoutes(r)

	//connecController(defaultPort)
	openbrowser("http://localhost:8000")
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
