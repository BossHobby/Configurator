//go:generate statik -f -dest ../../pkg -src=../../web/dist

package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"runtime/pprof"
	"syscall"
	"time"

	log "github.com/sirupsen/logrus"
)

var (
	githubToken = ""
	version     = "dirty"
	mode        = "debug"

	verbose = flag.Bool("verbose", false, "verbose logging")

	watch = flag.Bool("watch", false, "watch for new ports")
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

func main() {
	flag.Parse()

	if githubToken == "" {
		githubToken = os.Getenv("GITHUB_TOKEN")
	}

	logFilePath := "quicksilver.log"
	if runtime.GOOS == "darwin" {
		logFilePath = os.ExpandEnv("${HOME}/quicksilver.log")
	}

	log.SetLevel(log.DebugLevel)
	logFile, err := os.Create(logFilePath)
	if err != nil {
		log.Fatal(err)
	}
	log.SetOutput(io.MultiWriter(os.Stderr, logFile))

	if mode == "debug" {
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
	}

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

	for {
		if err := connectFirstPort(); err != nil {
			log.Error(err)

			if *watch {
				time.Sleep(500 * time.Millisecond)
				continue
			} else {
				break
			}
		}

		if !*watch {
			break
		}
	}

}
