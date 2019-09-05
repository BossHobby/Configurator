package main

import (
	"bufio"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/NotFastEnuf/configurator/controller"
	"github.com/NotFastEnuf/configurator/controller/protocol"
	"github.com/fxamacker/cbor"
)

var mode protocol.BLHeliMode

const blheliFlashSize = 7168

func verifyFlash(flash, verify []byte) bool {
	for i := 0; i < len(flash); i++ {
		if verify[i] != flash[i] {
			return false
		}
	}
	return true
}

func control(fc *controller.Controller) {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		cmd := strings.Fields(scanner.Text())
		if len(cmd) == 0 {
			continue
		}

		switch cmd[0] {
		case "R":
			fc.Port.Write([]byte{'R'})

		case "4way":
			protocol.SendMSP(fc.Port, protocol.MSP4wayIf)
		case "version":
			protocol.SendMSP(fc.Port, protocol.MSPApiVersion)
		case "info":
			protocol.SendMSP(fc.Port, protocol.MSPBoardInfo)
			protocol.SendMSP(fc.Port, protocol.MSPBuildInfo)
		case "fc":
			protocol.SendMSP(fc.Port, protocol.MSPFcVariant)
			protocol.SendMSP(fc.Port, protocol.MSPFcVersion)

		case "get":
			quicCMD := byte(0)
			if len(cmd) > 1 {
				i, err := strconv.Atoi(cmd[1])
				if err == nil {
					quicCMD = byte(i)
				}
			}
			res := protocol.SendQUIC(fc.Port, 1, []byte{quicCMD})
			log.Printf("%+v\n", res)
			value := new(interface{})
			if err := cbor.Unmarshal(res, value); err != nil {
				log.Fatal(err)
			}
			log.Printf("%+v\n", *value)

		case "follow":
			quicCMD := byte(0)
			if len(cmd) > 1 {
				i, err := strconv.Atoi(cmd[1])
				if err == nil {
					quicCMD = byte(i)
				}
			}

			for {
				res := protocol.SendQUIC(fc.Port, 1, []byte{quicCMD})

				value := new(interface{})
				if err := cbor.Unmarshal(res, value); err != nil {
					log.Fatal(err)
				}

				log.Printf("%+v\n", *value)
				time.Sleep(250 * time.Millisecond)
			}

		case "alive":
			log.Println("<blheli> sending alive")
			protocol.SendBlheli(fc.Port, protocol.BLHeliCmdInterfaceTestAlive, 0, []byte{})
		case "name":
			log.Println("<blheli> sending name")
			res := protocol.SendBlheli(fc.Port, protocol.BLHeliCmdInterfaceGetName, 0, []byte{})
			log.Printf("<blheli> name: %q\n", string(res.PARAMS))

		case "init":
			esc := 0
			if len(cmd) > 1 {
				i, err := strconv.Atoi(cmd[1])
				if err == nil {
					esc = i
				}
			}

			log.Printf("<blheli> sending init %d\n", esc)
			res := protocol.SendBlheli(fc.Port, protocol.BLHeliCmdDeviceInitFlash, 0, []byte{byte(esc)})
			signature, other, mode := uint16(res.PARAMS[1])<<8|uint16(res.PARAMS[0]), res.PARAMS[2], res.PARAMS[3]
			log.Printf("<blheli> init mode: %d signature: %x other: %x\n", mode, signature, other)

		case "reset":
			esc := 0
			if len(cmd) > 1 {
				i, err := strconv.Atoi(cmd[1])
				if err == nil {
					esc = i
				}
			}

			log.Printf("<blheli> sending reset %d\n", esc)
			res := protocol.SendBlheli(fc.Port, protocol.BLHeliCmdDeviceReset, 0, []byte{byte(esc)})
			log.Printf("<blheli> reset: % x\n", res.PARAMS)

		case "read":
			log.Println("<blheli> sending read")

			flash := fc.ReadFlash(blheliFlashSize)
			if err := ioutil.WriteFile("dump.bin", flash, 0755); err != nil {
				log.Fatal(err)
			}
			verify, err := ioutil.ReadFile("verify.bin")
			if err != nil {
				log.Fatal(err)
			}

			if verifyFlash(flash, verify) {
				log.Println("<blheli> flash verify succeeded!")
			} else {
				log.Println("<blheli> flash verify failed!")
			}

		case "write":
			log.Println("<blheli> sending write")
			flash, err := ioutil.ReadFile("dump.bin")
			if err != nil {
				log.Fatal(err)
			}
			fc.WriteFlash(flash[:blheliFlashSize])
			log.Println("<blheli> writeFlash done!")

		case "exit":
			log.Println("<blheli> sending exit")
			protocol.SendBlheli(fc.Port, protocol.BLHeliCmdInterfaceExit, 0, []byte{})
		}
	}
}

func main() {
	fc, err := controller.OpenController("/dev/ttyACM0")
	if err != nil {
		log.Fatalf("serial.Open: %v", err)
	}

	go func() {
		defer fc.Close()
		if err := fc.Run(); err != nil {
			log.Fatal(err)
		}
	}()

	control(fc)
}
