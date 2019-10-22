//go:generate statik -f -dest ../../pkg -src=../../web/dist

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"

	"github.com/fxamacker/cbor"
	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

var (
	fc      *controller.Controller
	status  Status
	version = "dirty"
	mode    = "debug"

	verbose = flag.Bool("verbose", false, "verbose logging")
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

	log.Printf("Configurator running at %s!", url)
}

func serve() {
	log.Printf("Starting Quicksilver Configurator %s", version)

	r := mux.NewRouter()
	setupRoutes(r)

	go watchPorts()
	go broadcastQuic()

	if mode == "release" {
		openbrowser("http://localhost:8000")
	}
	if err := http.ListenAndServe("localhost:8000", cors.Default().Handler(r)); err != nil {
		log.Fatal(err)
	}
}

func printJson(v interface{}) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}

func main() {
	flag.Parse()

	if mode == "debug" {
		log.SetLevel(log.DebugLevel)
	}

	if flag.NArg() == 0 {
		serve()
		return
	}

	if err := connectFirstController(); err != nil {
		log.Fatal(err)
	}

	switch flag.Arg(0) {
	case "download":
		value := controller.Profile{}
		if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			printJson(value)
		}

		f, err := os.Create(value.Filename())
		if err != nil {
			log.Fatal(err)
		}

		if err := cbor.NewEncoder(f, cbor.EncOptions{}).Encode(value); err != nil {
			log.Fatal(err)
		}
	case "upload":
		if flag.NArg() != 2 {
			log.Fatal("usage: quic-config upload <filename>")
		}

		f, err := os.Open(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}

		value := controller.Profile{}
		if err := cbor.NewDecoder(f).Decode(&value); err != nil {
			log.Fatal(err)
		}
		if err := fc.SetQUIC(controller.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			printJson(value)
		}
	}
}
