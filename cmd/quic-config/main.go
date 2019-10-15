//go:generate statik -f -src=../../web/dist

package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"reflect"
	"runtime"
	"time"

	"github.com/NotFastEnuf/configurator/controller"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

var (
	fc      *controller.Controller
	status  Status
	version = "dirty"
	mode    = "debug"
)

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

func watchPorts() {
	for {
		s, err := controllerStatus()
		if err != nil {
			log.Println(err)
			time.Sleep(500 * time.Millisecond)
			continue
		}

		if !reflect.DeepEqual(*s, status) {
			broadcastWebsocket("status", s)
		}
		status = *s
		time.Sleep(500 * time.Millisecond)
	}
}

func broadcastQuiuc() {
	for {
		select {
		case msg := <-controller.QuicLog:
			broadcastWebsocket("log", msg)
		case msg := <-controller.QuicBlackbox:
			broadcastWebsocket("blackbox", msg)
		}
	}
}

func main() {
	log.Printf("Starting Quicksilver Configurator %s\n", version)

	r := mux.NewRouter()
	setupRoutes(r)

	go watchPorts()
	go broadcastQuiuc()

	//connecController(defaultPort)
	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}
