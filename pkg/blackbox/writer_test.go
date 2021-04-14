package blackbox_test

import (
	"os"
	"testing"

	"github.com/BossHobby/configurator/pkg/blackbox"
	"github.com/BossHobby/configurator/pkg/protocol/quic"
)

func TestStructTags(t *testing.T) {
	b := quic.BlackboxCompact{}
	w := blackbox.NewDefaultWriter(os.Stdout)

	w.WriteHeaders()
	w.WriteValue(&b)
}
