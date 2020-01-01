package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/NotFastEnuf/configurator/pkg/firmware"
	_ "github.com/NotFastEnuf/configurator/pkg/statik"
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

func handleError(w http.ResponseWriter, err error) {
	http.Error(w, err.Error(), http.StatusInternalServerError)
	log.Error(err)
}

func loggingMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func (s *Server) fcMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.fc == nil {
			http.NotFound(w, r)
			return
		}
		next.ServeHTTP(w, r)
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
			handleError(w, err)
			return
		}
		if os.IsNotExist(err) {
			f, err = statikFS.Open(indexFile)
			if err != nil {
				handleError(w, err)
				return
			}
		}

		stat, err := f.Stat()
		if err != nil {
			handleError(w, err)
			return
		}
		if stat.IsDir() {
			f, err = statikFS.Open(indexFile)
			if err != nil {
				handleError(w, err)
				return
			}
		}

		w.Header().Set("Cache-Control", "max-age=30")
		w.Header().Set("Cache-Control", "max-age=30")
		http.ServeContent(w, r, stat.Name(), time.Now(), f)
	}
}

func (s *Server) postConnect(w http.ResponseWriter, r *http.Request) {
	serialPort := ""
	if err := json.NewDecoder(r.Body).Decode(&serialPort); err != nil {
		handleError(w, err)
		return
	}

	if err := s.connectController(serialPort); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func (s *Server) postDisconnect(w http.ResponseWriter, r *http.Request) {
	s.closeController()
	renderJSON(w, "OK")
}

func (s *Server) getProfile(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := s.fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postProfile(w http.ResponseWriter, r *http.Request) {
	profile := controller.Profile{}
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		handleError(w, err)
		return
	}

	if err := s.fc.SetQUIC(controller.QuicValProfile, &profile); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, profile)
}

func (s *Server) getDefaultProfile(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := s.fc.GetQUIC(controller.QuicValDefaultProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getProfileDownload(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := s.fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename="+value.Filename())
	w.Header().Set("Content-Type", "application/octet-stream")
	if err := cbor.NewEncoder(w, cbor.EncOptions{}).Encode(value); err != nil {
		handleError(w, err)
		return
	}
}

func (s *Server) postProfileUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		handleError(w, err)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	value := controller.Profile{}
	if err := s.fc.SetQUICReader(controller.QuicValProfile, file, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getBlackboxRate(w http.ResponseWriter, r *http.Request) {
	value := 0
	if err := s.fc.GetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postBlackboxRate(w http.ResponseWriter, r *http.Request) {
	value := 0
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	if err := s.fc.SetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postCalImu(w http.ResponseWriter, r *http.Request) {
	_, err := s.fc.SendQUIC(controller.QuicCmdCalImu, []byte{})
	if err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func (s *Server) getPidRatePresets(w http.ResponseWriter, r *http.Request) {
	value := make([]controller.PidRatePreset, 0)
	if err := s.fc.GetQUIC(controller.QuicValPidRatePresets, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := controller.VtxSettings{}
	if err := s.fc.GetQUIC(controller.QuicValVtxSettings, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := controller.VtxSettings{}
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	if err := s.fc.SetQUIC(controller.QuicValVtxSettings, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func broadcastProgress(task string) func(total, current int) {
	last := 0
	return func(total, current int) {
		percent := int(float64(current) / float64(total) * 100)
		if last == percent {
			return
		}

		broadcastWebsocket("flash", firmware.FlashProgress{
			Task:    task,
			Total:   100,
			Current: percent,
		})
		last = percent
	}
}

func (s *Server) postFlashLocal(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		handleError(w, err)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		handleError(w, err)
		return
	}
	defer file.Close()

	hex, err := ioutil.ReadAll(file)
	if err != nil {
		handleError(w, err)
		return
	}

	fw, err := firmware.ParseIntelHex(hex)
	if err != nil {
		handleError(w, err)
		return
	}

	s.dfuMu.Lock()
	defer func() {
		s.closeController()
		s.dfuMu.Unlock()
	}()

	if err := s.fl.Flash(s.dfuLoader, fw, broadcastProgress); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func (s *Server) postFlashRemote(w http.ResponseWriter, r *http.Request) {
	downloadProgress := broadcastProgress("download")

	downloadProgress(100, 0)
	value := firmware.RemoteFirmware{}
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	downloadProgress(100, 10)

	hex, err := s.fl.FetchRelease(value)
	if err != nil {
		handleError(w, err)
		return
	}
	downloadProgress(100, 90)

	fw, err := firmware.ParseIntelHex(hex)
	if err != nil {
		handleError(w, err)
		return
	}
	downloadProgress(100, 100)

	s.dfuMu.Lock()
	defer func() {
		s.closeController()
		s.dfuMu.Unlock()
	}()

	if err := s.fl.Flash(s.dfuLoader, fw, broadcastProgress); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func (s *Server) getFirmwareReleases(w http.ResponseWriter, r *http.Request) {
	releases, err := s.fl.ListReleases()
	if err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, releases)
}

func (s *Server) postFlashConnect(w http.ResponseWriter, r *http.Request) {
	s.dfuMu.Lock()
	defer s.dfuMu.Unlock()

	if s.dfuLoader == nil {
		d, err := dfu.NewLoader()
		if err != nil {
			s.dfuLoader = nil
			if err != dfu.ErrDeviceNotFound {
				handleError(w, err)
				return
			}
		} else {
			log.Debug("detected dfu")
			s.dfuLoader = d
		}
	}

	renderJSON(w, "OK")
}

func (s *Server) setupRoutes(r *mux.Router) {
	r.Use(loggingMidleware)

	r.HandleFunc("/api/connect", s.postConnect).Methods("POST")
	r.HandleFunc("/api/disconnect", s.postDisconnect).Methods("POST")

	r.HandleFunc("/api/flash/releases", s.getFirmwareReleases).Methods("GET")
	r.HandleFunc("/api/flash/connect", s.postFlashConnect).Methods("POST")
	r.HandleFunc("/api/flash/local", s.postFlashLocal).Methods("POST")
	r.HandleFunc("/api/flash/remote", s.postFlashRemote).Methods("POST")

	r.HandleFunc("/api/hard_reboot", func(w http.ResponseWriter, r *http.Request) {
		if s.fc == nil {
			fc, err := controller.OpenFirstController()
			if err != nil {
				handleError(w, err)
				return
			}
			go func() {
				select {
				case <-fc.Disconnect:
				case <-time.After(500 * time.Millisecond):
				}
				fc.Close()
			}()
			fc.HardReboot()
		} else {
			s.fc.HardReboot()
		}
		renderJSON(w, "OK")
	}).Methods("POST")

	r.HandleFunc("/api/soft_reboot", func(w http.ResponseWriter, r *http.Request) {
		if s.fc == nil {
			fc, err := controller.OpenFirstController()
			if err != nil {
				handleError(w, err)
				return
			}
			go func() {
				select {
				case <-fc.Disconnect:
				case <-time.After(500 * time.Millisecond):
				}
				fc.Close()
			}()
			fc.SoftReboot()
		} else {
			s.fc.SoftReboot()
		}
		s.autoConnect = true
		renderJSON(w, "OK")
	}).Methods("POST")

	{
		f := r.NewRoute().Subrouter()
		f.Use(s.fcMidleware)

		f.HandleFunc("/api/profile", s.getProfile).Methods("GET")
		f.HandleFunc("/api/profile", s.postProfile).Methods("POST")

		f.HandleFunc("/api/default_profile", s.getDefaultProfile).Methods("GET")
		f.HandleFunc("/api/pid_rate_presets", s.getPidRatePresets).Methods("GET")

		f.HandleFunc("/api/profile/download", s.getProfileDownload).Methods("GET")
		f.HandleFunc("/api/profile/upload", s.postProfileUpload).Methods("POST")

		f.HandleFunc("/api/blackbox/rate", s.getBlackboxRate).Methods("GET")
		f.HandleFunc("/api/blackbox/rate", s.postBlackboxRate).Methods("POST")

		f.HandleFunc("/api/vtx/settings", s.getVtxSettings).Methods("GET")
		f.HandleFunc("/api/vtx/settings", s.postVtxSettings).Methods("POST")

		f.HandleFunc("/api/cal_imu", s.postCalImu).Methods("POST")
	}

	r.HandleFunc("/api/ws", s.websocketHandler)
	r.PathPrefix("/").HandlerFunc(spaHandler())
}
