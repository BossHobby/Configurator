package controller

import (
	"log"
)

const mspHeaderLen = byte(5)

const MSPApiVersion byte = 1 //out message
const MSPFcVariant byte = 2  //out message
const MSPFcVersion byte = 3  //out message
const MSPBoardInfo byte = 4  //out message
const MSPBuildInfo byte = 5  //out message

const MSP4wayIf byte = 245 //out message

func (c *Controller) ReadMSP() {
	buf := make([]byte, mspHeaderLen)
	length, err := c.port.Read(buf)
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

	payload, err := c.readAtLeast(int(payloadLen))
	if err != nil {
		log.Fatal(err)
	}
	length += len(payload)

	if length != size {
		log.Printf("% x (%s)\n", buf[:length], string(buf[:length]))
		log.Fatalf("<msp> invalid size (%d vs %d)", length, size)
	}

	chksum := buf[length-1]
	log.Printf("<msp> received cmd: %d size: %d chksum: %d\n", cmd, payloadLen, chksum)
}

func (c *Controller) SendMSP(cmd byte) {
	buf := []byte{
		'$',
		'M',
		'<',
		0,
		cmd,
	}
	buf = appendCRC8(buf)

	c.writeChannel <- buf
	c.ReadMSP()
}
