package quic_test

import (
	"testing"

	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/quic"
	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetLevel(log.DebugLevel)
}

func TestProtocol(t *testing.T) {
	c, err := controller.OpenFirstController()
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()

	proto, err := quic.NewQuicProtocol(c)
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("%+v", proto.Info)
}
