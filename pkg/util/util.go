package util

import "io"

func AppendCRC8(buf []byte) []byte {
	chksum := byte(0)
	for i := 0; i < len(buf); i++ {
		chksum ^= buf[i]
	}
	buf = append(buf, chksum)
	return buf
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
