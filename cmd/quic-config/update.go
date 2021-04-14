package main

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"runtime"

	log "github.com/sirupsen/logrus"

	"github.com/blang/semver"
	"github.com/google/go-github/v31/github"
	"github.com/inconshreveable/go-update"
	"golang.org/x/oauth2"
)

const (
	repoOwner = "BossHobby"
	repoName  = "Configurator"
)

type Updater struct {
	c *github.Client

	found   bool
	release int64
}

func NewUpdater() *Updater {
	ctx := context.Background()

	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: githubToken})
	c := github.NewClient(oauth2.NewClient(ctx, ts))
	return &Updater{
		c:     c,
		found: false,
	}
}

func (u *Updater) Check(current string) error {
	if current == "dirty" {
		return nil
	}
	cv, err := semver.ParseTolerant(current)
	if err != nil {
		return err
	}

	ctx := context.Background()
	release, _, err := u.c.Repositories.GetLatestRelease(ctx, repoOwner, repoName)
	if err != nil {
		return err
	}

	nv, err := semver.ParseTolerant(release.GetTagName())
	if err != nil {
		return err
	}

	if nv.GT(cv) {
		log.Printf("update %s => %s availible", cv, nv)
		u.found = true
		u.release = release.GetID()
	} else {
		u.found = false
	}

	return nil
}

func findAsset(assets []*github.ReleaseAsset) *github.ReleaseAsset {
	name := fmt.Sprintf("quic-config-%s-%s.zip", runtime.GOOS, runtime.GOARCH)
	for i, a := range assets {
		if a.GetName() == name {
			return assets[i]
		}
	}
	return nil
}

func (u *Updater) Update() error {
	ctx := context.Background()

	assets, _, err := u.c.Repositories.ListReleaseAssets(ctx, repoOwner, repoName, u.release, nil)
	if err != nil {
		return err
	}

	asset := findAsset(assets)
	if asset == nil {
		return errors.New("no matching asset found")
	}

	rc, _, err := u.c.Repositories.DownloadReleaseAsset(ctx, repoOwner, repoName, asset.GetID(), http.DefaultClient)
	if err != nil {
		return err
	}
	defer rc.Close()

	buf, err := ioutil.ReadAll(rc)
	if err != nil {
		return err
	}

	r := bytes.NewReader(buf)
	z, err := zip.NewReader(r, r.Size())
	if err != nil {
		return err
	}

	binName := fmt.Sprintf("quic-config-%s-%s", runtime.GOOS, runtime.GOARCH)
	if runtime.GOOS == "windows" {
		binName += ".exe"
	}

	for _, file := range z.File {
		if file.FileInfo().IsDir() {
			continue
		}

		_, name := filepath.Split(file.Name)
		if name == binName {
			f, err := file.Open()
			if err != nil {
				return err
			}
			defer f.Close()

			return update.Apply(f, update.Options{})
		}
	}

	return errors.New("no matching binary found")
}
