package main

import (
	"bytes"
	"context"
	"errors"
	"io/ioutil"
	"net/http"
	"runtime"

	"path/filepath"

	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/google/go-github/v28/github"
	"github.com/marcinbor85/gohex"
	"golang.org/x/oauth2"
)

const (
	repoOwner = "NotFastEnuf"
	repoName  = "Guano"
)

type RemoteFirmware struct {
	ID   int64
	Name string
}

func listFirmwareReleases() ([]RemoteFirmware, error) {
	ctx := context.Background()

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: githubToken},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	release, _, err := client.Repositories.GetReleaseByTag(ctx, repoOwner, repoName, "latest")
	if err != nil {
		return nil, err
	}

	assets, _, err := client.Repositories.ListReleaseAssets(ctx, repoOwner, repoName, release.GetID(), nil)
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

func fetchFirmwareRelease(id int64) ([]byte, error) {
	ctx := context.Background()

	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: githubToken},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	rc, url, err := client.Repositories.DownloadReleaseAsset(ctx, repoOwner, repoName, id)
	if err != nil {
		return nil, err
	}
	if rc == nil {
		res, err := http.Get(url)
		if err != nil {
			return nil, err
		}
		defer res.Body.Close()

		rc = res.Body
	}

	buf, err := ioutil.ReadAll(rc)
	if err != nil {
		return nil, err

	}
	return buf, nil
}

func parseIntelHex(input []byte) ([]byte, error) {
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

func readFirmware(file string) ([]byte, error) {
	ext := filepath.Ext(file)

	if ext == ".bin" {
		return ioutil.ReadFile(file)
	} else if ext == ".hex" {
		buf, err := ioutil.ReadFile(file)
		if err != nil {
			return nil, err
		}
		return parseIntelHex(buf)
	}

	return nil, errors.New("unknown file type")
}

type FlashProgress struct {
	Task    string
	Total   int
	Current int
}

func broadcastProgress(task string) func(total, current int) {
	last := 0
	return func(total, current int) {
		percent := int(float64(current) / float64(total) * 100)
		if last == percent {
			return
		}

		broadcastWebsocket("flash", FlashProgress{
			Task:    task,
			Total:   100,
			Current: percent,
		})
		last = percent
	}
}

func flashFirmware(l *dfu.Loader, input []byte) error {
	eraseProgress := broadcastProgress("erase")
	eraseProgress(100, 0)
	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}
	eraseProgress(100, 10)

	if err := l.SetAddress(0x08000000); err != nil {
		return err
	}
	eraseProgress(100, 20)

	if runtime.GOOS != "windows" {
		if err := l.MassErase(); err != nil {
			return err
		}
	}
	eraseProgress(100, 100)

	if err := l.Write(input, broadcastProgress("write")); err != nil {
		return err
	}

	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}

	buf := make([]byte, len(input))
	if err := l.Read(buf, broadcastProgress("verify")); err != nil {
		return err
	}

	for i := 0; i < len(buf); i++ {
		if input[i] != buf[i] {
			return errors.New("verify failed")
		}
	}

	if err := l.EnterState(dfu.DfuIdle); err != nil {
		return err
	}

	if err := l.Leave(); err != nil {
		return err
	}

	return nil
}
