package protocol

import (
	"io"
	"log"

	"github.com/fxamacker/cbor"
)

const quicHeaderLen = uint16(4)

var quicChannel = make(chan []byte, 0)

func ReadQUIC(port io.Reader) error {
	buf := make([]byte, quicHeaderLen)
	length := 1

	for length != int(quicHeaderLen) {
		n, err := port.Read(buf[length:])
		if err != nil {
			return err
		}
		if n == 0 {
			break
		}
		length += n
	}

	cmd := buf[1]
	payloadLen := uint16(buf[2])<<8 | uint16(buf[3])
	size := int(quicHeaderLen + payloadLen)
	log.Printf("<quic> received cmd: %d size: %d\n", cmd, size)

	buf = append(buf, make([]byte, size)...)
	for length != size {
		n, err := port.Read(buf[length:size])
		if err != nil {
			return err
		}
		if n == 0 {
			break
		}
		length += n
	}
	if length != size {
		log.Printf("% x (%s)\n", buf[:length], string(buf[:length]))
		log.Fatalf("<quic> invalid size (%d vs %d)", length, size)
	}

	res := buf[quicHeaderLen : quicHeaderLen+payloadLen]
	if cmd == 3 {
		val := new(string)
		if err := cbor.Unmarshal(res, val); err != nil {
			log.Fatal(err)
		}
		log.Printf("<quic> log %s\n", *val)
	} else {
		quicChannel <- res
	}
	return nil
}

func SendQUIC(port io.ReadWriter, cmd byte, data []byte) []byte {
	buf := []byte{
		'#',
		cmd,
		byte((len(data) >> 8) & 0xFF),
		byte(len(data) & 0xFF),
	}
	buf = append(buf, data...)

	if _, err := port.Write(buf); err != nil {
		log.Fatal(err)
	}

	return <-quicChannel
}
