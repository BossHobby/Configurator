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
	"os/signal"
	"runtime"
	"runtime/pprof"
	"strconv"
	"syscall"

	"github.com/fxamacker/cbor/v2"
	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/quic"
	"github.com/NotFastEnuf/configurator/pkg/util"
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

func printJSON(v interface{}) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}

func getOSDFont(q *quic.QuicProtocol, w io.Writer) error {
	r, err := q.Get(quic.QuicValOSDFont)
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

func setOSDFont(qp *quic.QuicProtocol, r io.Reader) error {
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

	qr, err := qp.Set(quic.QuicValOSDFont, w)
	if err != nil {
		return err
	}

	var val string
	if err := cbor.NewDecoder(qr).Decode(&val); err != nil {
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

	f, err := os.Create("quic-config.perf")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)
	defer func() {
		log.Debugf("closing")
		pprof.StopCPUProfile()
		f.Close()
	}()

	if flag.NArg() == 0 {
		c := make(chan os.Signal, 1)
		signal.Notify(c,
			syscall.SIGHUP,
			syscall.SIGINT,
			syscall.SIGTERM,
			syscall.SIGQUIT)

		s, err := NewServer()
		if err != nil {
			log.Fatal()
		}
		defer s.Close()
		go s.Serve()

		log.Printf("got signal %s", <-c)
		return
	}

	fc, err := controller.OpenFirstController()
	if err != nil {
		log.Fatal(err)
	}
	defer fc.Close()

	qp, err := quic.NewQuicProtocol(fc)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("connected to %s@%s", qp.Info.TargetName, qp.Info.GITVersion)

	switch flag.Arg(0) {
	case "get":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <val>")
		}

		val, err := strconv.ParseInt(flag.Arg(1), 10, 32)
		if err != nil {
			log.Fatal(err)
		}

		r, err := qp.Get(quic.QuicValue(val))
		if err != nil {
			log.Fatal(err)
		}
		defer r.Close()

		dec := cbor.NewDecoder(r)
		value := new(interface{})
		for {
			if err := dec.Decode(&value); err != nil {
				if err == io.EOF {
					break
				}
				log.Error(err)
				return
			}

			log.Debugf("%+v", *value)
			if err := printJSON(util.ConvertForJSON(value)); err != nil {
				log.Fatal(err)
			}
		}
		break
	case "blackbox":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <cmd>")
		}

		val, err := strconv.ParseInt(flag.Arg(1), 10, 32)
		if err != nil {
			log.Fatal(err)
		}

		req := new(bytes.Buffer)
		if err := cbor.NewEncoder(req).Encode(val); err != nil {
			log.Fatal(err)
		}

		p, err := qp.Send(quic.QuicCmdBlackbox, req)
		if err != nil {
			log.Fatal(err)
		}
		defer p.Payload.Close()

		value := new(interface{})
		if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
			log.Fatal(err)
		}

		if err := printJSON(value); err != nil {
			log.Fatal(err)
		}
		break
	case "get_osd_font":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <filename>")
		}

		f, err := os.Create(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		if err := getOSDFont(qp, f); err != nil {
			log.Fatal(err)
		}
		break
	case "set_osd_font":
		if flag.NArg() != 2 {
			log.Fatal("must supply a <filename>")
		}

		f, err := os.Open(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		if err := setOSDFont(qp, f); err != nil {
			log.Fatal(err)
		}
		break
	case "download":
		value := quic.Profile{}
		if err := qp.GetValue(quic.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			if err := printJSON(value); err != nil {
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
		break
	case "upload":
		if flag.NArg() != 2 {
			log.Fatal("usage: quic-config upload <filename>")
		}

		f, err := os.Open(flag.Arg(1))
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		value := quic.Profile{}
		if err := cbor.NewDecoder(f).Decode(&value); err != nil {
			log.Fatal(err)
		}
		if err := qp.SetValue(quic.QuicValProfile, &value); err != nil {
			log.Fatal(err)
		}
		if *verbose {
			if err := printJSON(value); err != nil {
				log.Fatal(err)
			}
		}
		break
	default:
		fmt.Printf("unknown command %q\n", flag.Arg(0))
		flag.Usage()
		os.Exit(1)
		break
	}

}
