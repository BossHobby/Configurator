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

	"github.com/fxamacker/cbor/v2"
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

func getOSDFont(fc *controller.Controller, w io.Writer) error {
	r, err := fc.GetQUICReader(controller.QuicValOSDFont)
	if err != nil {
		return err
	}

	dec := cbor.NewDecoder(r)

	width, height, border := 12, 18, 1
	img := image.NewNRGBA(image.Rect(0, 0, 16*(width+border)+border, 16*(height+border)+border))

	for y := 0; y < img.Bounds().Dy(); y++ {
		for x := 0; x < img.Bounds().Dx(); x++ {
			img.Set(x, y, color.RGBA{255, 0, 0, 255})
		}
	}

	for cy := 0; cy < 16; cy++ {
		for cx := 0; cx < 16; cx++ {
			setPixel := func(x, y int, v uint8) {
				switch v {
				case 0:
					img.Set(x+cx*(width+border)+border, y+cy*(height+border)+border, color.Black)
				case 2:
					img.Set(x+cx*(width+border)+border, y+cy*(height+border)+border, color.White)
				default:
					img.Set(x+cx*(width+border)+border, y+cy*(height+border)+border, color.Transparent)
				}
			}

			var buf []byte
			if err := dec.Decode(&buf); err != nil {
				return err
			}

			x, y := 0, 0
			for _, b := range buf {
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

	return png.Encode(w, img)
}

func setOSDFont(fc *controller.Controller, r io.Reader) error {
	img, err := png.Decode(r)
	if err != nil {
		return err
	}

	w, buf := new(bytes.Buffer), make([]byte, 54)
	enc := cbor.NewEncoder(w)

	width, height, border := 12, 18, 1
	for cy := 0; cy < 16; cy++ {
		for cx := 0; cx < 16; cx++ {

			getPixel := func(x, y int) byte {
				v := img.At(x+cx*(width+border)+border, y+cy*(height+border)+border)

				switch color.RGBAModel.Convert(v) {
				case color.RGBA{0, 0, 0, 255}:
					return 0
				case color.RGBA{255, 255, 255, 255}:
					return 2
				default:
					return 1
				}
			}

			x, y := 0, 0
			for j := 0; j < 54; j++ {
				buf[j] = (getPixel(x+0, y)&0x3)<<6 |
					(getPixel(x+1, y)&0x3)<<4 |
					(getPixel(x+2, y)&0x3)<<2 |
					(getPixel(x+3, y)&0x3)<<0

				x += 4
				if x == width {
					x = 0
					y++
				}
			}

			if err := enc.Encode(buf); err != nil {
				return err
			}
		}
	}

	var val string
	if err := fc.SetQUICReader(controller.QuicValOSDFont, w, &val); err != nil {
		return err
	}

	return nil
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
	case "get":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <val>")
		}

		val, err := strconv.ParseInt(flag.Arg(1), 10, 32)
		if err != nil {
			log.Fatal(err)
		}

		value := new([]map[string]interface{})
		if err := fc.GetQUIC(controller.QuicValue(val), value); err != nil {
			log.Fatal(err)
		}
		log.Printf("%+v", *value)

		if err := printJson(value); err != nil {
			log.Fatal(err)
		}

	case "get_osd_font":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <filename>")
		}

		f, err := os.Create(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		if err := getOSDFont(fc, f); err != nil {
			log.Fatal(err)
		}

	case "set_osd_font":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <filename>")
		}

		f, err := os.Open(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		if err := setOSDFont(fc, f); err != nil {
			log.Fatal(err)
		}

	case "download":
		value := controller.Profile{}
		if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			if err := printJson(value); err != nil {
				log.Fatal(err)
			}
		}

		f, err := os.Create(value.Filename())
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		if err := cbor.NewEncoder(f).Encode(value); err != nil {
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
		defer f.Close()

		value := controller.Profile{}
		if err := cbor.NewDecoder(f).Decode(&value); err != nil {
			log.Fatal(err)
		}
		if err := fc.SetQUIC(controller.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			if err := printJson(value); err != nil {
				log.Fatal(err)
			}
		}
	default:
		fmt.Printf("unknown command %q\n", flag.Arg(0))
		flag.Usage()
		os.Exit(1)
	}
}
