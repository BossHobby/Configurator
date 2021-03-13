package main

import (
	"encoding/json"
	"os"

	"github.com/NotFastEnuf/configurator/pkg/blackbox"
	"github.com/NotFastEnuf/configurator/pkg/protocol/quic"
	log "github.com/sirupsen/logrus"
)

func readBlackbox() ([]quic.BlackboxCompact, error) {
	res := make([]quic.BlackboxCompact, 0)

	f, err := os.Open("aw.json")
	if err != nil {
		return nil, err
	}

	dec := json.NewDecoder(f)
	for dec.More() {
		b := quic.BlackboxCompact{}
		if err := dec.Decode(&b); err != nil {
			return nil, err
		}
		res = append(res, b)
	}
	return res, nil
}

func main() {
	bb, err := readBlackbox()
	if err != nil {
		log.Fatal(err)
	}

	f, err := os.Create("test.bfl")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	w := blackbox.NewDefaultWriter(f)

	w.WriteHeaders()
	for _, b := range bb {
		w.WriteValue(&b)
	}
}
