package main

import (
	"encoding/binary"
	"io"
	"time"

	"github.com/fxamacker/cbor/v2"
	log "github.com/sirupsen/logrus"

	"github.com/NotFastEnuf/configurator/pkg/blheli"
	"github.com/NotFastEnuf/configurator/pkg/controller"
	"github.com/NotFastEnuf/configurator/pkg/quic"
)

func init() {
	log.SetLevel(log.DebugLevel)
}

type descriptor struct {
	offset uint16
	size   uint16
}

var BLHELI_LAYOUT = map[string]descriptor{
	"MAIN_REVISION":            {offset: 0x00, size: 1},
	"SUB_REVISION":             {offset: 0x01, size: 1},
	"LAYOUT_REVISION":          {offset: 0x02, size: 1},
	"P_GAIN":                   {offset: 0x03, size: 1},
	"I_GAIN":                   {offset: 0x04, size: 1},
	"GOVERNOR_MODE":            {offset: 0x05, size: 1},
	"LOW_VOLTAGE_LIMIT":        {offset: 0x06, size: 1},
	"MOTOR_GAIN":               {offset: 0x07, size: 1},
	"MOTOR_IDLE":               {offset: 0x08, size: 1},
	"STARTUP_POWER":            {offset: 0x09, size: 1},
	"PWM_FREQUENCY":            {offset: 0x0A, size: 1},
	"MOTOR_DIRECTION":          {offset: 0x0B, size: 1},
	"INPUT_PWM_POLARITY":       {offset: 0x0C, size: 1},
	"MODE":                     {offset: 0x0D, size: 2},
	"PROGRAMMING_BY_TX":        {offset: 0x0F, size: 1},
	"REARM_AT_START":           {offset: 0x10, size: 1},
	"GOVERNOR_SETUP_TARGET":    {offset: 0x11, size: 1},
	"STARTUP_RPM":              {offset: 0x12, size: 1},
	"STARTUP_ACCELERATION":     {offset: 0x13, size: 1},
	"VOLT_COMP":                {offset: 0x14, size: 1},
	"COMMUTATION_TIMING":       {offset: 0x15, size: 1},
	"DAMPING_FORCE":            {offset: 0x16, size: 1},
	"GOVERNOR_RANGE":           {offset: 0x17, size: 1},
	"STARTUP_METHOD":           {offset: 0x18, size: 1},
	"PPM_MIN_THROTTLE":         {offset: 0x19, size: 1},
	"PPM_MAX_THROTTLE":         {offset: 0x1A, size: 1},
	"BEEP_STRENGTH":            {offset: 0x1B, size: 1},
	"BEACON_STRENGTH":          {offset: 0x1C, size: 1},
	"BEACON_DELAY":             {offset: 0x1D, size: 1},
	"THROTTLE_RATE":            {offset: 0x1E, size: 1},
	"DEMAG_COMPENSATION":       {offset: 0x1F, size: 1},
	"BEC_VOLTAGE":              {offset: 0x20, size: 1},
	"PPM_CENTER_THROTTLE":      {offset: 0x21, size: 1},
	"SPOOLUP_TIME":             {offset: 0x22, size: 1},
	"TEMPERATURE_PROTECTION":   {offset: 0x23, size: 1},
	"LOW_RPM_POWER_PROTECTION": {offset: 0x24, size: 1},
	"PWM_INPUT":                {offset: 0x25, size: 1},
	"PWM_DITHER":               {offset: 0x26, size: 1},
	"BRAKE_ON_STOP":            {offset: 0x27, size: 1},
	"LED_CONTROL":              {offset: 0x28, size: 1},

	"LAYOUT": {offset: 0x40, size: 16},
	"MCU":    {offset: 0x50, size: 16},
	"NAME":   {offset: 0x60, size: 16},
}

func run(bl *blheli.BLHeliProtocol) error {
	defer func() {
		res, err := bl.SendBlheli(blheli.BLHeliCmdInterfaceExit, 0, []byte{})
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("%+v %s", res, res.PARAMS)
	}()

	res, err := bl.SendBlheli(blheli.BLHeliCmdInterfaceGetName, 0, []byte{})
	if err != nil {
		return err
	}
	log.Printf("%+v %s", res, res.PARAMS)

	res, err = bl.SendBlheli(blheli.BLHeliCmdProtocolGetVersion, 0, []byte{})
	if err != nil {
		return err
	}
	log.Printf("%+v %s", res, res.PARAMS)

	time.Sleep(500 * time.Millisecond)

	res, err = bl.SendBlheli(blheli.BLHeliCmdDeviceInitFlash, 0, []byte{1})
	if err != nil {
		return err
	}
	log.Printf("%+v %s", res, res.PARAMS)

	flash, err := bl.ReadFlash(0x1A00, 0x70)
	if err != nil {
		return err
	}

	values := make(map[string]interface{})
	for key, d := range BLHELI_LAYOUT {
		switch d.size {
		case 1:
			values[key] = flash[d.offset]
		case 2:
			values[key] = binary.LittleEndian.Uint16(flash[d.offset : d.offset+d.size])
		case 16:
			values[key] = string(flash[d.offset : d.offset+d.size])
		}
	}
	log.Println(values)

	return nil
}

func main() {
	fc, err := controller.OpenFirstController()
	if err != nil {
		log.Fatal(err)
	}
	defer fc.Close()

	qp, err := quic.NewQuicProtocol(fc)
	if err != nil {
		log.Fatal(err)
	}

	p, err := qp.Get(quic.QuicValBLHeliSettings)
	if err != nil {
		log.Fatal(err)
	}

	value := new(interface{})
	dec := cbor.NewDecoder(p)
	for {
		if err := dec.Decode(&value); err != nil {
			if err == io.EOF {
				break
			}
			log.Fatal(err)
		}
		log.Printf("%+v", *value)
	}

	/*
		bl, err := blheli.NewBLHeliProtocol(fc)
		if err != nil {
			log.Fatal(err)
		}

		if err := run(bl); err != nil {
			log.Fatal(err)
		}
	*/
}
