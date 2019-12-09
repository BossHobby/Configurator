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

func postConnect(w http.ResponseWriter, r *http.Request) {
	serialPort := ""
	if err := json.NewDecoder(r.Body).Decode(&serialPort); err != nil {
		handleError(w, err)
		return
	}

	if err := connectController(serialPort); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func postDisconnect(w http.ResponseWriter, r *http.Request) {
	closeController()
	renderJSON(w, "OK")
}

func fcMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if fc == nil {
			http.NotFound(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func getProfile(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func postProfile(w http.ResponseWriter, r *http.Request) {
	profile := controller.Profile{}
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		handleError(w, err)
		return
	}

	if err := fc.SetQUIC(controller.QuicValProfile, &profile); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, profile)
}

func getDefaultProfile(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := fc.GetQUIC(controller.QuicValDefaultProfile, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func getProfileDownload(w http.ResponseWriter, r *http.Request) {
	value := controller.Profile{}
	if err := fc.GetQUIC(controller.QuicValProfile, &value); err != nil {
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

func postProfileUpload(w http.ResponseWriter, r *http.Request) {
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
	if err := fc.SetQUICReader(controller.QuicValProfile, file, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func getBlackboxRate(w http.ResponseWriter, r *http.Request) {
	value := 0
	if err := fc.GetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func postBlackboxRate(w http.ResponseWriter, r *http.Request) {
	value := 0
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	if err := fc.SetQUIC(controller.QuicValBlackboxRate, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func postCalImu(w http.ResponseWriter, r *http.Request) {
	_, err := fc.SendQUIC(controller.QuicCmdCalImu, []byte{})
	if err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func getPidRatePresets(w http.ResponseWriter, r *http.Request) {
	value := make([]controller.PidRatePreset, 0)
	if err := fc.GetQUIC(controller.QuicValPidRatePresets, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func getVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := controller.VtxSettings{}
	if err := fc.GetQUIC(controller.QuicValVtxSettings, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func postVtxSettings(w http.ResponseWriter, r *http.Request) {
	value := controller.VtxSettings{}
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}
	if err := fc.SetQUIC(controller.QuicValVtxSettings, &value); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, value)
}

func postFlashLocal(w http.ResponseWriter, r *http.Request) {
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

	fw, err := parseIntelHex(hex)
	if err != nil {
		handleError(w, err)
		return
	}

	dfuMu.Lock()
	defer dfuMu.Unlock()
	defer closeController()

	if err := flashFirmware(dfuLoader, fw); err != nil {
		handleError(w, err)
		return
	}

	renderJSON(w, "OK")
}

func postFlashRemote(w http.ResponseWriter, r *http.Request) {
	value := RemoteFirmware{}
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		handleError(w, err)
		return
	}

	hex, err := fetchFirmwareRelease(value.ID)
	if err != nil {
		handleError(w, err)
		return
	}

	fw, err := parseIntelHex(hex)
	if err != nil {
		handleError(w, err)
		return
	}

	dfuMu.Lock()
	defer dfuMu.Unlock()
	defer closeController()

	if err := flashFirmware(dfuLoader, fw); err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, "OK")
}

func getFirmwareReleases(w http.ResponseWriter, r *http.Request) {
	releases, err := listFirmwareReleases()
	if err != nil {
		handleError(w, err)
		return
	}
	renderJSON(w, releases)
}

func postFlashConnect(w http.ResponseWriter, r *http.Request) {
	dfuMu.Lock()
	defer dfuMu.Unlock()

	if dfuLoader == nil {
		d, err := dfu.NewLoader()
		if err != nil {
			dfuLoader = nil
			if err != dfu.ErrDeviceNotFound {
				handleError(w, err)
				return
			}
		} else {
			log.Debug("detected dfu")
			dfuLoader = d
		}
	}

	renderJSON(w, "OK")
}

func setupRoutes(r *mux.Router) {
	r.Use(loggingMidleware)

	r.HandleFunc("/api/connect", postConnect).Methods("POST")
	r.HandleFunc("/api/disconnect", postDisconnect).Methods("POST")

	r.HandleFunc("/api/flash/releases", getFirmwareReleases).Methods("GET")
	r.HandleFunc("/api/flash/connect", postFlashConnect).Methods("POST")
	r.HandleFunc("/api/flash/local", postFlashLocal).Methods("POST")
	r.HandleFunc("/api/flash/remote", postFlashRemote).Methods("POST")

	{
		f := r.NewRoute().Subrouter()
		f.Use(fcMidleware)

		f.HandleFunc("/api/profile", getProfile).Methods("GET")
		f.HandleFunc("/api/profile", postProfile).Methods("POST")

		f.HandleFunc("/api/default_profile", getDefaultProfile).Methods("GET")
		f.HandleFunc("/api/pid_rate_presets", getPidRatePresets).Methods("GET")

		f.HandleFunc("/api/profile/download", getProfileDownload).Methods("GET")
		f.HandleFunc("/api/profile/upload", postProfileUpload).Methods("POST")

		f.HandleFunc("/api/blackbox/rate", getBlackboxRate).Methods("GET")
		f.HandleFunc("/api/blackbox/rate", postBlackboxRate).Methods("POST")

		f.HandleFunc("/api/vtx/settings", getVtxSettings).Methods("GET")
		f.HandleFunc("/api/vtx/settings", postVtxSettings).Methods("POST")

		f.HandleFunc("/api/cal_imu", postCalImu).Methods("POST")

		f.HandleFunc("/api/soft_reboot", func(w http.ResponseWriter, r *http.Request) {
			fc.SoftReboot()
			autoConnect = true
			renderJSON(w, "OK")
		}).Methods("POST")
		f.HandleFunc("/api/hard_reboot", func(w http.ResponseWriter, r *http.Request) {
			fc.HardReboot()
			renderJSON(w, "OK")
		}).Methods("POST")
	}

	r.HandleFunc("/api/ws", websocketHandler)
	r.PathPrefix("/").HandlerFunc(spaHandler())
}
