package controller

import (
	"errors"
	"log"
	"sync"
	"time"

	"github.com/fxamacker/cbor"
)

type quicPacket struct {
	cmd     uint8
	len     uint16
	payload []byte
}

const quicHeaderLen = uint16(4)

var quicChannel = make(chan quicPacket)
var quicMu sync.Mutex

func (c *Controller) ReadQUIC() error {
	header, err := c.readAtLeast(int(quicHeaderLen - 1))
	if err != nil {
		return err
	}
	length := int(quicHeaderLen)

	cmd := header[0]
	payloadLen := uint16(header[1])<<8 | uint16(header[2])
	size := int(quicHeaderLen + payloadLen)

	payload, err := c.readAtLeast(int(payloadLen))
	if err != nil {
		return err
	}

	if len(payload) != int(payloadLen) {
		log.Printf("% x (%s)\n", payload, string(payload))
		log.Fatalf("<quic> invalid size (%d vs %d)", length, size)
	}

	packet := quicPacket{
		cmd:     cmd,
		len:     payloadLen,
		payload: payload,
	}
	log.Printf("<quic> received cmd: %d len: %d\n", packet.cmd, packet.len)

	if packet.cmd == 3 {
		val := new(string)
		if err := cbor.Unmarshal(packet.payload, val); err != nil {
			log.Fatal(err)
		}
		log.Printf("<quic> log %s\n", *val)
	} else {
		quicChannel <- packet
	}
	return nil
}

func (c *Controller) SendQUIC(cmd byte, data []byte) ([]byte, error) {
	buf := []byte{
		'#',
		cmd,
		byte((len(data) >> 8) & 0xFF),
		byte(len(data) & 0xFF),
	}
	buf = append(buf, data...)

	c.writeChannel <- buf

	select {
	case p := <-quicChannel:
		return p.payload, nil
	case <-time.After(1 * time.Second):
		return nil, errors.New("quic recive timeout")
	}
}
