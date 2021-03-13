package util

import (
	"io"
	"reflect"
)

func UpdateCRC8(crc uint8, buf []byte) uint8 {
	for _, b := range buf {
		crc ^= b
	}
	return crc
}

func UpdateCRC16(crc uint16, data uint16) uint16 {
	crc = crc ^ (data << 8)
	for j := 0; j < 8; j++ {
		if crc&0x8000 != 0 {
			crc = (crc << 1) ^ 0x1021
		} else {
			crc <<= 1
		}
	}
	return crc
}

func AppendCRC16(buf []byte) []byte {
	crc := uint16(0)

	for i := 0; i < len(buf); i++ {
		crc = UpdateCRC16(crc, uint16(buf[i]))
	}

	buf = append(buf, byte((crc>>8)&0xFF))
	buf = append(buf, byte(crc&0xFF))
	return buf
}

func ReadAtLeast(r io.Reader, size int) ([]byte, error) {
	length := 0

	buf := make([]byte, size)
	for length != size {
		n, err := r.Read(buf[length:size])
		if err != nil {
			return nil, err
		}
		length += n
	}

	return buf, nil
}

func ConvertForJSON(data interface{}) interface{} {
	val := reflect.ValueOf(data)
	kind := val.Kind()

	switch kind {
	case reflect.Ptr:
		return ConvertForJSON(val.Elem().Interface())

	case reflect.Slice:
		tmp, result := make([]interface{}, val.Len()), make([]interface{}, val.Len())
		for i := 0; i < val.Len(); i++ {
			tmp[i] = val.Index(i).Interface()
		}
		for i, v := range tmp {
			result[i] = ConvertForJSON(v)
		}
		return result

	case reflect.Map:
		tmp := make(map[string]interface{})
		for _, k := range val.MapKeys() {
			typeOfValue := reflect.TypeOf(val.MapIndex(k).Interface()).Kind()
			if typeOfValue == reflect.Map || typeOfValue == reflect.Slice {
				tmp[k.Elem().String()] = ConvertForJSON(val.MapIndex(k).Interface())
			} else {
				tmp[k.Elem().String()] = val.MapIndex(k).Interface()
			}
		}
		return tmp
	}

	return data
}
