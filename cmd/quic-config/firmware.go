package main

import (
	"bufio"
	"context"
	"encoding/hex"
	"errors"
	"io/ioutil"
	"net/http"
	"os"

	"path/filepath"

	"github.com/NotFastEnuf/configurator/pkg/dfu"
	"github.com/google/go-github/v28/github"
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

func readFirmware(file string) ([]byte, error) {
	ext := filepath.Ext(file)

	if ext == ".bin" {
		return ioutil.ReadFile(file)
	} else if ext == ".hex" {
		f, err := os.Open(file)
		if err != nil {
			return nil, err
		}
		defer f.Close()

		buf := make([]byte, 0)
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			decoded, err := hex.DecodeString(scanner.Text()[1:])
			if err != nil {
				return nil, err
			}
			buf = append(buf, decoded...)
		}
		return buf, nil
	}

	return nil, errors.New("unknown file type")
}

type FlashProgress struct {
	Task    string
	Total   int
	Current int
}

func broadcastProgress(task string) func(total, current int) {
	return func(total, current int) {
		broadcastWebsocket("flash", FlashProgress{
			Task:    task,
			Total:   total,
			Current: current,
		})
	}
}

func flashFirmware(l *dfu.Loader, input []byte) error {
	if err := l.Write(input, broadcastProgress("write")); err != nil {
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
