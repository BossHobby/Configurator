package firmware

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/google/go-github/v31/github"
	"github.com/marcinbor85/gohex"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"gopkg.in/djherbis/fscache.v0"
)

const (
	repoOwner = "NotFastEnuf"
	repoName  = "Guano"
)

type RemoteFirmware struct {
	ID   int64
	Name string
}

type FirmwareLoader struct {
	cache  fscache.Cache
	github *github.Client
}

type FlashProgress struct {
	Task    string
	Total   int
	Current int
}

func NewFirmwareLoader(cacheDir string, githubToken string) (*FirmwareLoader, error) {
	c, err := fscache.New(cacheDir, 0755, time.Hour)
	if err != nil {
		return nil, err
	}
	ctx := context.Background()

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: githubToken})
	tc := oauth2.NewClient(ctx, ts)
	return &FirmwareLoader{
		cache:  c,
		github: github.NewClient(tc),
	}, nil
}

func (l *FirmwareLoader) ListReleases() ([]string, error) {
	ctx := context.Background()

	releases, _, err := l.github.Repositories.ListReleases(ctx, repoOwner, repoName, nil)
	if err != nil {
		return nil, err
	}

	results := make([]string, 0)
	for _, r := range releases {
		results = append(results, r.GetTagName())
	}
	return results, nil
}

func (l *FirmwareLoader) ListAssets(tag string) ([]RemoteFirmware, error) {
	ctx := context.Background()

	release, _, err := l.github.Repositories.GetReleaseByTag(ctx, repoOwner, repoName, tag)
	if err != nil {
		return nil, err
	}

	assets, _, err := l.github.Repositories.ListReleaseAssets(ctx, repoOwner, repoName, release.GetID(), nil)
	if err != nil {
		return nil, err
	}

	res := make([]RemoteFirmware, len(assets))
	for i, a := range assets {
		res[i] = RemoteFirmware{
			ID:   a.GetID(),
			Name: a.GetName(),
		}
	}
	return res, nil
}

func (l *FirmwareLoader) FetchRelease(fw RemoteFirmware) ([]byte, error) {
	file := fmt.Sprintf("%d-%s", fw.ID, fw.Name)
	log.Debugf("fetching firmware %s", file)

	r, w, err := l.cache.Get(file)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	if w != nil {
		log.Debugf("firmware %s not found in cache, downloading", file)
		ctx := context.Background()
		rc, url, err := l.github.Repositories.DownloadReleaseAsset(ctx, repoOwner, repoName, fw.ID, http.DefaultClient)
		if err != nil {
			return nil, err
		}
		if rc == nil {
			res, err := http.Get(url)
			if err != nil {
				return nil, err
			}
			rc = res.Body
		}

		io.Copy(w, rc)

		w.Close()
		rc.Close()
	}

	buf, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, err
	}
	log.Debugf("firmware %s downloaded", file)
	return buf, nil
}

func (fl *FirmwareLoader) Flash(l *dfu.Loader, input []byte, broadcastProgress func(task string) func(total, current int)) error {
	eraseProgress := broadcastProgress("erase")
	eraseProgress(100, 0)
	log.Debug("dfu: entering idle state")
	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}
	eraseProgress(100, 10)

	log.Debug("dfu: setting flash address 0x08000000")
	if err := l.SetAddress(0x08000000); err != nil {
		return err
	}
	log.Debug("dfu: entering idle state")
	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}
	eraseProgress(100, 20)

	log.Debug("dfu: starting mass-erase")
	if err := l.MassErase(); err != nil {
		return err
	}
	eraseProgress(100, 100)

	log.Debug("dfu: starting firmware write")
	if err := l.Write(input, broadcastProgress("write")); err != nil {
		return err
	}

	log.Debug("dfu: entering idle state")
	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}

	log.Debug("dfu: starting firmware verify")
	buf := make([]byte, len(input))
	if err := l.Read(buf, broadcastProgress("verify")); err != nil {
		return err
	}

	for i := 0; i < len(buf); i++ {
		if input[i] != buf[i] {
			return errors.New("verify failed")
		}
	}

	log.Debug("dfu: entering idle state")
	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}

	log.Debug("dfu: leaving")
	if err := l.Leave(); err != nil {
		return err
	}

	return nil
}

func ParseIntelHex(input []byte) ([]byte, error) {
	r := bytes.NewReader(input)
	mem := gohex.NewMemory()

	if err := mem.ParseIntelHex(r); err != nil {
		return nil, err
	}

	buf := make([]byte, 0)
	for _, segment := range mem.GetDataSegments() {
		addr := int(segment.Address) - 0x08000000
		if addr < 0 {
			continue
		}

		end := (addr + len(segment.Data))
		if end > len(buf) {
			buf = append(buf, make([]byte, end-len(buf))...)
		}

		for i, d := range segment.Data {
			buf[addr+i] = d
		}
	}

	return buf, nil
}
