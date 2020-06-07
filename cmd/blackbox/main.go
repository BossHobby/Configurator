package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/NotFastEnuf/configurator/pkg/quic"
	log "github.com/sirupsen/logrus"
)

type FieldDefinition struct {
	Name   string
	Signed bool
}

var fields = []FieldDefinition{
	{Name: "loopIteration", Signed: false},
	{Name: "time", Signed: false},

	{Name: "axisP[0]", Signed: true},
	{Name: "axisP[1]", Signed: true},
	{Name: "axisP[2]", Signed: true},

	{Name: "axisI[0]", Signed: true},
	{Name: "axisI[1]", Signed: true},
	{Name: "axisI[2]", Signed: true},

	{Name: "axisD[0]", Signed: true},
	{Name: "axisD[1]", Signed: true},
	{Name: "axisD[2]", Signed: true},

	//"axisF[0]",
	//"axisF[1]",
	//"axisF[2]",

	{Name: "rcCommand[0]", Signed: true},
	{Name: "rcCommand[1]", Signed: true},
	{Name: "rcCommand[2]", Signed: true},
	{Name: "rcCommand[3]", Signed: true},

	{Name: "setpoint[0]", Signed: true},
	{Name: "setpoint[1]", Signed: true},
	{Name: "setpoint[2]", Signed: true},
	{Name: "setpoint[3]", Signed: true},

	//"vbatLatest",
	//"amperageLatest",
	//"rssi",

	{Name: "gyroADC[0]", Signed: true},
	{Name: "gyroADC[1]", Signed: true},
	{Name: "gyroADC[2]", Signed: true},

	{Name: "accSmooth[0]", Signed: true},
	{Name: "accSmooth[1]", Signed: true},
	{Name: "accSmooth[2]", Signed: true},

	//"debug[0]",
	//"debug[1]",
	//"debug[2]",
	//"debug[3]",

	{Name: "motor[0]", Signed: true},
	{Name: "motor[1]", Signed: true},
	{Name: "motor[2]", Signed: true},
	{Name: "motor[3]", Signed: true},
}

func writeHeader(f *os.File, key, value string) error {
	_, err := f.WriteString(fmt.Sprintf("H %s:%s\n", key, value))
	return err
}

func headerJoin(def []FieldDefinition, fn func(d FieldDefinition) string) string {
	res := ""
	for i, d := range def {
		res += fn(d)
		if i != len(def)-1 {
			res += ","
		}
	}
	return res
}

func encodeUnsigned(val uint) []byte {
	res := make([]byte, 0)
	for val > 127 {
		res = append(res, byte((val&0xFF)|0x80))
		val >>= 7
	}
	res = append(res, byte(val))
	return res
}

func encodeSigned(val int) []byte {
	unsigned := uint((val << 1) ^ (val >> 31))
	return encodeUnsigned(unsigned)
}

func encodeVec3(vals [3]int, fn func(val int) int) []byte {
	res := make([]byte, 0)
	for _, val := range vals {
		res = append(res, encodeSigned(fn(val))...)
	}
	return res
}

func encodeVec4(vals [4]int, fn func(val int) int) []byte {
	res := make([]byte, 0)
	for _, val := range vals {
		res = append(res, encodeSigned(fn(val))...)
	}
	return res
}

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

func passthru(val int) int {
	return val
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

	writeHeader(f, "Product", "Blackbox flight data recorder by Nicholas Sherlock")
	writeHeader(f, "Data version", "2")

	writeHeader(f, "I interval", "4")
	writeHeader(f, "P interval", "1/4")

	writeHeader(f, "Field I name", headerJoin(fields, func(d FieldDefinition) string {
		return d.Name
	}))

	writeHeader(f, "Field I signed", headerJoin(fields, func(d FieldDefinition) string {
		if d.Signed {
			return "1"
		}
		return "0"
	}))

	writeHeader(f, "Field I predictor", headerJoin(fields, func(d FieldDefinition) string {
		return "0"
	}))

	writeHeader(f, "Field I encoding", headerJoin(fields, func(d FieldDefinition) string {
		if d.Signed {
			return "0"
		}
		return "1"
	}))

	writeHeader(f, "Field P predictor", headerJoin(fields, func(d FieldDefinition) string {
		return "0"
	}))

	writeHeader(f, "Field P encoding", headerJoin(fields, func(d FieldDefinition) string {
		if d.Signed {
			return "0"
		}
		return "1"
	}))

	writeHeader(f, "gyro_scale", "0x3089705f")
	writeHeader(f, "acc_1G", "1000")
	writeHeader(f, "motorOutput", "0,1000")

	for _, b := range bb {
		f.Write([]byte{'I'})

		f.Write(encodeUnsigned(uint(b.Loop)))
		f.Write(encodeUnsigned(uint(b.Time)))

		f.Write(encodeVec3(b.PidPTerm, passthru))
		f.Write(encodeVec3(b.PidITerm, passthru))
		f.Write(encodeVec3(b.PidDTerm, passthru))

		f.Write(encodeSigned(b.Rx[0] / 2))
		f.Write(encodeSigned(b.Rx[1] / 2))
		f.Write(encodeSigned(b.Rx[2] / 2))
		f.Write(encodeSigned(1000 + b.Rx[3]))

		f.Write(encodeVec4(b.Setpoint, passthru))

		f.Write(encodeVec3(b.GyroFilter, passthru))
		f.Write(encodeVec3(b.AccelFilter, passthru))

		f.Write(encodeVec4(b.Motor, passthru))
	}

}
