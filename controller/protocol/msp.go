package protocol

import (
	"io"
	"log"
)

const mspHeaderLen = byte(5)

const MSPApiVersion byte = 1 //out message
const MSPFcVariant byte = 2  //out message
const MSPFcVersion byte = 3  //out message
const MSPBoardInfo byte = 4  //out message
const MSPBuildInfo byte = 5  //out message

const MSP4wayIf byte = 245 //out message

func ReadMSP(port io.Reader) {
	buf := make([]byte, mspHeaderLen)
	length, err := port.Read(buf)
	if err != nil {
		log.Fatal(err)
	}

	if buf[0] != '$' || buf[1] != 'M' {
		log.Printf("% x (%s)\n", buf[:length], string(buf[:length]))
		log.Fatal("<msp> invalid magic")
	}

	if buf[2] != '>' {
		log.Printf("% x (%s)\n", buf[:length], string(buf[:length]))
		log.Fatal("<msp> invalid dir")
	}

	payloadLen, cmd := buf[3], buf[4]
	size := int(mspHeaderLen + payloadLen + 1)
	buf = append(buf, make([]byte, size)...)
	for length != size {
		n, err := port.Read(buf[length:size])
		if err != nil {
			log.Fatal(err)
		}
		if n == 0 {
			break
		}
		length += n
	}

	if length != size {
		log.Printf("% x (%s)\n", buf[:length], string(buf[:length]))
		log.Fatalf("<msp> invalid size (%d vs %d)", length, size)
	}

	chksum := buf[length-1]
	log.Printf("<msp> received cmd: %d size: %d chksum: %d\n", cmd, payloadLen, chksum)
}

func SendMSP(port io.ReadWriter, cmd byte) {
	buf := []byte{
		'$',
		'M',
		'<',
		0,
		cmd,
	}
	buf = appendCRC8(buf)

	if _, err := port.Write(buf); err != nil {
		log.Fatal(err)
	}

	ReadMSP(port)
}
