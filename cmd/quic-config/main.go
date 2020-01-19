//go:generate statik -f -dest ../../pkg -src=../../web/dist

package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strconv"

	"github.com/fxamacker/cbor"
	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
)

var (
	githubToken = ""
	version     = "dirty"
	mode        = "debug"

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

func cacheDir() string {
	var dir string
	switch runtime.GOOS {
	case "linux":
		dir = os.ExpandEnv("${XDG_CACHE_HOME}/quic-config")
		if dir == "/quic-config" {
			dir = os.ExpandEnv("${HOME}/.cache/quic-config")
		}
	case "windows":
		dir = os.ExpandEnv("${LOCALAPPDATA}/quic-config")
	case "darwin":
		dir = os.ExpandEnv("${HOME}/Library/Caches/quic-config")
	default:
		dir = "./cache"
	}
	if err := os.Mkdir(dir, 0775); err != nil && !os.IsExist(err) {
		log.Fatal(err)
	}
	return dir
}

func printJson(v interface{}) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}

func main() {
	flag.Parse()

	//if mode == "debug" {
	log.SetLevel(log.DebugLevel)
	logFile, err := os.Create("quicksilver.log")
	if err != nil {
		log.Fatal(err)
	}
	log.SetOutput(io.MultiWriter(os.Stderr, logFile))
	//}

	if flag.NArg() == 0 {
		s, err := NewServer()
		if err != nil {
			log.Fatal()
		}
		defer s.Close()

		s.Serve()
		return
	}

	fc, err := controller.OpenFirstController()
	if err != nil {
		log.Fatal(err)
	}
	defer fc.Close()

	switch flag.Arg(0) {
	case "get_char":
		str := flag.Arg(1)

		val, err := strconv.Atoi(str)
		if err != nil {
			log.Fatal(err)
		}

		req, err := cbor.Marshal(val, cbor.EncOptions{})
		if err != nil {
			log.Fatal(err)
		}

		p, err := fc.SendQUIC(controller.QuicCmdGetOSDChar, req)
		if err != nil {
			log.Fatal(err)
		}

		dec := cbor.NewDecoder(bytes.NewReader(p.Payload))

		width, height := 12, 18
		img := image.NewGray(image.Rect(0, 0, 16*width, 16*height))

		for cy := 0; cy < 16; cy++ {
			for cx := 0; cx < 16; cx++ {
				var buf []byte
				if err := dec.Decode(&buf); err != nil {
					log.Fatal(err)
				}

				setPixel := func(x, y int, v uint8) {
					if v == 0 {
						img.Set(x+cx*width, y+cy*height, color.Black)
					} else {
						img.Set(x+cx*width, y+cy*height, color.White)
					}
				}

				x, y := 0, 0
				for _, b := range buf[:54] {
					setPixel(x+0, y, (b>>6)&0x3)
					setPixel(x+1, y, (b>>4)&0x3)
					setPixel(x+2, y, (b>>2)&0x3)
					setPixel(x+3, y, (b>>0)&0x3)

					x += 4
					if x == width {
						x = 0
						y++
					}
				}
			}
		}

		f, err := os.Create("image.png")
		if err != nil {
			log.Fatal(err)
		}

		png.Encode(f, img)

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
