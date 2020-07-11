package blackbox

import (
	"fmt"
	"io"
	"reflect"
	"strconv"
	"strings"
)

type FieldDefinition struct {
	Name    string
	Signed  bool
	Convert func(int64) int64
}

func convertFlip(val int64) int64 {
	return -val
}

func convertOffset(offset int64) func(int64) int64 {
	return func(val int64) int64 {
		return offset + val
	}
}

var DefaultFields = []FieldDefinition{
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

	{
		Name:   "rcCommand[0]",
		Signed: true,
		Convert: func(val int64) int64 {
			return val / 2
		},
	},
	{
		Name:   "rcCommand[1]",
		Signed: true,
		Convert: func(val int64) int64 {
			return val / 2
		},
	},
	{
		Name:   "rcCommand[2]",
		Signed: true,
		Convert: func(val int64) int64 {
			return -val / 2
		},
	},
	{
		Name:    "rcCommand[3]",
		Signed:  true,
		Convert: convertOffset(1000),
	},

	{Name: "setpoint[0]", Signed: true},
	{Name: "setpoint[1]", Signed: true},
	{Name: "setpoint[2]", Signed: true, Convert: convertFlip},
	{Name: "setpoint[3]", Signed: true},

	//"vbatLatest",
	//"amperageLatest",
	//"rssi",

	{Name: "gyroADC[0]", Signed: true},
	{Name: "gyroADC[1]", Signed: true},
	{Name: "gyroADC[2]", Signed: true, Convert: convertFlip},

	{Name: "accSmooth[0]", Signed: true},
	{Name: "accSmooth[1]", Signed: true},
	{Name: "accSmooth[2]", Signed: true, Convert: convertOffset(1000)},

	//"debug[0]",
	//"debug[1]",
	//"debug[2]",
	//"debug[3]",

	{Name: "motor[0]", Signed: true},
	{Name: "motor[1]", Signed: true},
	{Name: "motor[2]", Signed: true},
	{Name: "motor[3]", Signed: true},

	{Name: "debug[0]", Signed: false},
}

type Writer struct {
	w    io.Writer
	defs []FieldDefinition
}

func NewDefaultWriter(w io.Writer) *Writer {
	return NewWriter(w, DefaultFields)
}

func NewWriter(w io.Writer, defs []FieldDefinition) *Writer {
	return &Writer{
		w:    w,
		defs: defs,
	}
}

func (w *Writer) writeHeaderRaw(key, value string) (int, error) {
	buf := []byte(fmt.Sprintf("H %s:%s\n", key, value))
	return w.w.Write(buf)
}

func (w *Writer) writeHeaderJoin(key string, fn func(d FieldDefinition) string) (int, error) {
	val := ""
	for i, d := range w.defs {
		val += fn(d)
		if i != len(w.defs)-1 {
			val += ","
		}
	}

	return w.writeHeaderRaw(key, val)
}

func (w *Writer) WriteHeaders() {
	w.writeHeaderRaw("Product", "Blackbox flight data recorder by Nicholas Sherlock")
	w.writeHeaderRaw("Data version", "2")

	w.writeHeaderRaw("I interval", "4")
	w.writeHeaderRaw("P interval", "1/4")

	w.writeHeaderJoin("Field I name", func(d FieldDefinition) string {
		return d.Name
	})

	w.writeHeaderJoin("Field I signed", func(d FieldDefinition) string {
		if d.Signed {
			return "1"
		}
		return "0"
	})
	w.writeHeaderJoin("Field I predictor", func(d FieldDefinition) string {
		return "0"
	})
	w.writeHeaderJoin("Field I encoding", func(d FieldDefinition) string {
		if d.Signed {
			return "0"
		}
		return "1"
	})

	w.writeHeaderJoin("Field P predictor", func(d FieldDefinition) string {
		return "0"
	})
	w.writeHeaderJoin("Field P encoding", func(d FieldDefinition) string {
		if d.Signed {
			return "0"
		}
		return "1"
	})

	w.writeHeaderRaw("gyro_scale", "0x3089705f")
	w.writeHeaderRaw("acc_1G", "1000")
	w.writeHeaderRaw("motorOutput", "0,1000")
}

func (w *Writer) writeUnsigned(val uint) (int, error) {
	res := make([]byte, 0)
	for val > 127 {
		res = append(res, byte((val&0xFF)|0x80))
		val >>= 7
	}
	res = append(res, byte(val))

	return w.w.Write(res)
}

func (w *Writer) writeSigned(val int) (int, error) {
	unsigned := uint((val << 1) ^ (val >> 31))
	return w.writeUnsigned(unsigned)
}

func addValue(values map[string]int64, tag string, v reflect.Value) {
	switch v.Kind() {
	case reflect.Slice, reflect.Array:
		for i := 0; i < v.Len(); i++ {
			t := strings.Replace(tag, "[]", "["+strconv.Itoa(i)+"]", -1)
			addValue(values, t, v.Index(i))
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		values[tag] = v.Int()
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		values[tag] = int64(v.Uint())
	}
}

func (w *Writer) WriteValue(val interface{}) {
	values := make(map[string]int64, 0)

	vr := reflect.ValueOf(val).Elem()
	for i := 0; i < vr.NumField(); i++ {
		field := vr.Field(i)
		typ := vr.Type().Field(i)

		tag, ok := typ.Tag.Lookup("blackbox")
		if !ok {
			continue
		}

		addValue(values, tag, field)
	}

	w.w.Write([]byte{'I'})
	for _, d := range w.defs {
		v := values[d.Name]

		if d.Convert != nil {
			v = d.Convert(v)
		}

		if d.Signed {
			w.writeSigned(int(v))
		} else {
			w.writeUnsigned(uint(v))
		}
	}
}
