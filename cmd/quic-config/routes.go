package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/blheli"
	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/NotFastEnuf/configurator/pkg/firmware"
	"github.com/NotFastEnuf/configurator/pkg/quic"
	"github.com/NotFastEnuf/configurator/pkg/util"
	"github.com/fxamacker/cbor/v2"
	"github.com/gorilla/mux"
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

func (s *Server) spaHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const indexFile = "/index.html"

		upath := r.URL.Path
		if !strings.HasPrefix(upath, "/") {
			upath = "/" + upath
			r.URL.Path = upath
		}

		f, err := s.fs.Open(path.Clean(upath))
		if err != nil && !os.IsNotExist(err) {
			handleError(w, err)
			return
		}
		if os.IsNotExist(err) {
			f, err = s.fs.Open(indexFile)
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
			f, err = s.fs.Open(indexFile)
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
	value := quic.Profile{}
	if err := s.qp.GetValue(quic.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getOSDFont(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Disposition", "attachment; filename=font.png")
	w.Header().Set("Content-Type", "image/png")
	if err := getOSDFont(s.qp, w); err != nil {
		handleError(w, err)
		return
	}
}

func (s *Server) postOSDFont(w http.ResponseWriter, r *http.Request) {
	file := ""
	if err := json.NewDecoder(r.Body).Decode(&file); err != nil {
		handleError(w, err)
		return
	}

	f, err := s.fs.Open("/" + file + ".png")
	if err != nil {
		handleError(w, err)
		return
	}
	defer f.Close()

	if err := setOSDFont(s.qp, f); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func (s *Server) postProfile(w http.ResponseWriter, r *http.Request) {
	profile := quic.Profile{}
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		handleError(w, err)
		return
	}

	if err := s.qp.SetValue(quic.QuicValProfile, &profile); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, profile)
}

func (s *Server) getDefaultProfile(w http.ResponseWriter, r *http.Request) {
	value := quic.Profile{}
	if err := s.qp.GetValue(quic.QuicValDefaultProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func profileFilename(v interface{}) string {
	meta := v.(map[interface{}]interface{})["meta"].(map[interface{}]interface{})
	return fmt.Sprintf("Profile_%s_%s.json",
		strings.Replace(meta["name"].(string), "\x00", "", -1),
		time.Unix(int64(meta["datetime"].(uint64)), 0).Format("2006-01-02"),
	)
}

func (s *Server) getProfileDownload(w http.ResponseWriter, r *http.Request) {
	var value interface{}
	if err := s.qp.GetValue(quic.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename="+profileFilename(value))
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(util.ConvertForJSON(value)); err != nil {
		handleError(w, err)
		return
	}
}

func (s *Server) postProfileUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		handleError(w, err)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	var value quic.Profile

	ext := filepath.Ext(header.Filename)
	if ext == ".json" {
		if err := json.NewDecoder(file).Decode(&value); err != nil {
			handleError(w, err)
			return
		}
	} else if ext == ".cbor" {
		if err := cbor.NewDecoder(file).Decode(&value); err != nil {
			handleError(w, err)
			return
		}
	} else {
		handleError(w, errors.New("unsupported file type"))
	}

	if err := s.qp.SetValue(quic.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, value)
}

func (s *Server) getBlackbox(w http.ResponseWriter, r *http.Request) {
	p, err := s.qp.SendValue(quic.QuicCmdBlackbox, quic.QuicBlackboxGet, 0)
	if err != nil {
		handleError(w, err)
		return
	}
	defer p.Payload.Close()

	dec := cbor.NewDecoder(p.Payload)
	value := quic.BlackboxCompact{}
	for {
		if err := dec.Decode(&value); err != nil {
			if err == io.EOF {
				return
			}
			handleError(w, err)
			return
		}
		log.Printf("%+v", value)
		renderJSON(w, value)
		w.Write([]byte{'\n'})
	}
}

func (s *Server) getBlackboxList(w http.ResponseWriter, r *http.Request) {
	req := new(bytes.Buffer)
	if err := cbor.NewEncoder(req).Encode(quic.QuicBlackboxList); err != nil {
		handleError(w, err)
		return
	}

	p, err := s.qp.Send(quic.QuicCmdBlackbox, req)
	if err != nil {
		handleError(w, err)
		return
	}

	value := new(map[string]interface{})
	if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, value)
}

func (s *Server) posResetBlackbox(w http.ResponseWriter, r *http.Request) {
	req := new(bytes.Buffer)
	if err := cbor.NewEncoder(req).Encode(quic.QuicBlackboxReset); err != nil {
		handleError(w, err)
		return
	}
	if _, err := s.qp.Send(quic.QuicCmdBlackbox, req); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func (s *Server) postCalImu(w http.ResponseWriter, r *http.Request) {
	_, err := s.qp.Send(quic.QuicCmdCalImu, new(bytes.Buffer))
	if err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func (s *Server) getPidRatePresets(w http.ResponseWriter, r *http.Request) {
	value := make([]quic.PidRatePreset, 0)
	if err := s.qp.GetValue(quic.QuicValPidRatePresets, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := quic.VtxSettings{}
	if err := s.qp.GetValue(quic.QuicValVtxSettings, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := quic.VtxSettings{}
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	if err := s.qp.SetValue(quic.QuicValVtxSettings, &value); err != nil {
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
	values := make(map[string][]firmware.RemoteFirmware)

	releases, err := s.fl.ListReleases()
	if err != nil {
		handleError(w, err)
		return
	}

	for _, r := range releases {
		assets, err := s.fl.ListAssets(r)
		if err != nil {
			handleError(w, err)
			return
		}

		values[r] = assets
	}

	renderJSON(w, values)
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

func (s *Server) postUpdate(w http.ResponseWriter, r *http.Request) {
	if err := s.updater.Update(); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func (s *Server) getMotorTest(w http.ResponseWriter, r *http.Request) {
	p, err := s.qp.SendValue(quic.QuicCmdMotor, quic.QuicMotorTestStatus)
	if err != nil {
		handleError(w, err)
		return
	}

	value := new(map[string]interface{})
	if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, value)
}

func (s *Server) postMotorTestEnable(w http.ResponseWriter, r *http.Request) {
	p, err := s.qp.SendValue(quic.QuicCmdMotor, quic.QuicMotorTestEnable)
	if err != nil {
		handleError(w, err)
		return
	}

	value := new(interface{})
	if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postMotorTestDisable(w http.ResponseWriter, r *http.Request) {
	p, err := s.qp.SendValue(quic.QuicCmdMotor, quic.QuicMotorTestDisable)
	if err != nil {
		handleError(w, err)
		return
	}

	value := new(interface{})
	if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) postMotorTestValue(w http.ResponseWriter, r *http.Request) {
	input := make([]float32, 4)
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		handleError(w, err)
		return
	}

	p, err := s.qp.SendValue(quic.QuicCmdMotor, quic.QuicMotorTestSetValue, input)
	if err != nil {
		handleError(w, err)
		return
	}

	value := new(interface{})
	if err := cbor.NewDecoder(p.Payload).Decode(value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func (s *Server) getMotorBlheliSettings(w http.ResponseWriter, r *http.Request) {
	p, err := s.qp.Get(quic.QuicValBLHeliSettings)
	if err != nil {
		handleError(w, err)
		return
	}

	dec := cbor.NewDecoder(p)
	values := make([]blheli.BLHeliSettings, 0)
	for {
		value := new(blheli.BLHeliSettings)
		if err := dec.Decode(&value); err != nil {
			if err == io.EOF {
				break
			}
			handleError(w, err)
			return
		}
		values = append(values, *value)
	}

	renderJSON(w, values)
}

func (s *Server) postMotorBlheliSettings(w http.ResponseWriter, r *http.Request) {
	input := make([]blheli.BLHeliSettings, 0)
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		handleError(w, err)
		return
	}

	buf := new(bytes.Buffer)
	enc := cbor.NewEncoder(buf)
	for _, i := range input {
		if err := enc.Encode(i); err != nil {
			handleError(w, err)
			return
		}
	}

	_, err := s.qp.Set(quic.QuicValBLHeliSettings, buf)
	if err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func (s *Server) setupRoutes(r *mux.Router) {
	r.Use(loggingMidleware)

	r.HandleFunc("/api/connect", s.postConnect).Methods("POST")
	r.HandleFunc("/api/disconnect", s.postDisconnect).Methods("POST")
	r.HandleFunc("/api/update", s.postUpdate).Methods("POST")

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

		f.HandleFunc("/api/blackbox", s.getBlackbox).Methods("GET")
		f.HandleFunc("/api/blackbox/list", s.getBlackboxList).Methods("GET")
		f.HandleFunc("/api/blackbox/reset", s.posResetBlackbox).Methods("POST")

		f.HandleFunc("/api/profile", s.getProfile).Methods("GET")
		f.HandleFunc("/api/profile", s.postProfile).Methods("POST")

		f.HandleFunc("/api/default_profile", s.getDefaultProfile).Methods("GET")
		f.HandleFunc("/api/pid_rate_presets", s.getPidRatePresets).Methods("GET")

		f.HandleFunc("/api/profile/download", s.getProfileDownload).Methods("GET")
		f.HandleFunc("/api/profile/upload", s.postProfileUpload).Methods("POST")

		f.HandleFunc("/api/motor/settings", s.getMotorBlheliSettings).Methods("GET")
		f.HandleFunc("/api/motor/settings", s.postMotorBlheliSettings).Methods("POST")

		f.HandleFunc("/api/motor/test", s.getMotorTest).Methods("GET")
		f.HandleFunc("/api/motor/test/enable", s.postMotorTestEnable).Methods("POST")
		f.HandleFunc("/api/motor/test/disable", s.postMotorTestDisable).Methods("POST")
		f.HandleFunc("/api/motor/test/value", s.postMotorTestValue).Methods("POST")

		f.HandleFunc("/api/vtx/settings", s.getVtxSettings).Methods("GET")
		f.HandleFunc("/api/vtx/settings", s.postVtxSettings).Methods("POST")

		f.HandleFunc("/api/osd/font", s.getOSDFont).Methods("GET")
		f.HandleFunc("/api/osd/font", s.postOSDFont).Methods("POST")

		f.HandleFunc("/api/cal_imu", s.postCalImu).Methods("POST")
	}

	r.HandleFunc("/api/ws", s.websocketHandler)
	r.PathPrefix("/").HandlerFunc(s.spaHandler())
}
