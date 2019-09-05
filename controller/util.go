package controller

func appendCRC8(buf []byte) []byte {
	len := buf[3]
	size := len + mspHeaderLen + 1

	chksum := len
	for i := byte(4); i < (size - 1); i++ {
		chksum ^= buf[i]
	}

	buf = append(buf, chksum)
	return buf
}

func updateCRC16(crc uint16, data uint16) uint16 {
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

func appendCRC16(buf []byte) []byte {
	crc := uint16(0)

	for i := 0; i < len(buf); i++ {
		crc = updateCRC16(crc, uint16(buf[i]))
	}

	buf = append(buf, byte((crc>>8)&0xFF))
	buf = append(buf, byte(crc&0xFF))
	return buf
}
