package protocol

import (
	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/protocol/msp"
	"github.com/NotFastEnuf/configurator/pkg/protocol/quic"
)

type ProtocolType string

const (
	ProtocolInvalid ProtocolType = ""
	ProtocolMSP     ProtocolType = "msp"
	ProtocolQuic    ProtocolType = "quic"

	detectTries = 1
)

type Protocol interface {
	Detect() bool
	Close() error
	Info() (*controller.ControllerInfo, error)
}

func tryDetect(p Protocol) bool {
	for i := 0; i < detectTries; i++ {
		if p.Detect() {
			return true
		}
	}
	return false
}

func Detect(c *controller.Controller) ProtocolType {
	{
		c.Flush()

		p, err := msp.NewMSPProtocol(c)
		if err == nil {
			if tryDetect(p) {
				p.Close()
				return ProtocolMSP
			}
			p.Close()
		}
	}
	{
		c.Flush()

		p, err := quic.NewQuicProtocol(c)
		if err == nil {
			if tryDetect(p) {
				p.Close()
				return ProtocolQuic
			}
			p.Close()
		}
	}

	return ProtocolInvalid
}
