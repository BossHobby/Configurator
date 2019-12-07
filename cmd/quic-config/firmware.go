package main

import (
	"bufio"
	"encoding/hex"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/NotFastEnuf/configurator/pkg/dfu"
)

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

func flashFirmware(l *dfu.Loader, input []byte) error {
	if err := l.Write(input); err != nil {
		return err
	}

	buf := make([]byte, len(input))
	if err := l.Read(buf); err != nil {
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
