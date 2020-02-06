package main

import (
	log "github.com/sirupsen/logrus"

	serial "go.bug.st/serial"
)

const (
	STATE_IDLE = iota
	STATE_STARTING
	STATE_SENSOR_ID
	STATE_FRAME_ID
	STATE_DATA
)

type Payload struct {
	sensorID uint8
	frameID  uint8
	data     [7]byte
}

var (
	state   = STATE_STARTING
	offset  = 0
	payload Payload
	stuff   = false
)

func processSmartPort(b byte) (Payload, bool) {
	if b == 0x7D {
		stuff = true
		return payload, false
	}
	if stuff {
		b ^= 0x20
		stuff = false
	}

	switch state {
	case STATE_IDLE:
		if b == 0x7E {
			state = STATE_STARTING
		}
	case STATE_STARTING:
		offset = 0
		payload = Payload{}
		state = STATE_SENSOR_ID
	case STATE_SENSOR_ID:
		payload.sensorID = b
		state = STATE_FRAME_ID
	case STATE_FRAME_ID:
		payload.frameID = b
		state = STATE_DATA
	case STATE_DATA:
		if offset == 6 || b == 0x7E {
			state = STATE_STARTING
			return payload, offset == 6
		}
		payload.data[offset] = b
		offset++
	}
	return payload, false
}

func main() {
	mode := &serial.Mode{
		BaudRate: 57600,
		DataBits: 8,
		Parity:   serial.NoParity,
		StopBits: serial.OneStopBit,
	}
	port, err := serial.Open("/dev/ttyUSB0", mode)
	if err != nil {
		log.Fatal(err)
	}
	defer port.Close()

	buf := make([]byte, 128)
	for {
		n, err := port.Read(buf)
		if err != nil {
			log.Fatal(err)
		}

		for _, b := range buf[:n] {
			if p, ok := processSmartPort(b); ok {
				valueID := uint16(p.data[0])<<8 | uint16(p.data[1])
				data := uint32(p.data[2])<<24 | uint32(p.data[3])<<16 | uint32(p.data[4])<<8 | uint32(p.data[5])
				log.Printf("%+v value_id 0x%x data %d", p, valueID, data)
			}
		}
	}
}
