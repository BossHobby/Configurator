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
	"github.com/fxamacker/cbor"
)

var mode controller.BLHeliMode

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

		case "4way":
			fc.SendMSP(controller.MSP4wayIf)
		case "version":
			fc.SendMSP(controller.MSPApiVersion)
		case "info":
			fc.SendMSP(controller.MSPBoardInfo)
			fc.SendMSP(controller.MSPBuildInfo)
		case "fc":
			fc.SendMSP(controller.MSPFcVariant)
			fc.SendMSP(controller.MSPFcVersion)

		case "get":
			quicCMD := byte(0)
			if len(cmd) > 1 {
				i, err := strconv.Atoi(cmd[1])
				if err == nil {
					quicCMD = byte(i)
				}
			}
			res, err := fc.SendQUIC(1, []byte{quicCMD})
			if err != nil {
				log.Fatal(err)
			}

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
				res, err := fc.SendQUIC(1, []byte{quicCMD})
				if err != nil {
					log.Fatal(err)
				}
				value := new(interface{})
				if err := cbor.Unmarshal(res, value); err != nil {
					log.Fatal(err)
				}

				log.Printf("%+v\n", *value)
				time.Sleep(250 * time.Millisecond)
			}

		case "alive":
			log.Println("<blheli> sending alive")
			fc.SendBlheli(controller.BLHeliCmdInterfaceTestAlive, 0, []byte{})
		case "name":
			log.Println("<blheli> sending name")
			res := fc.SendBlheli(controller.BLHeliCmdInterfaceGetName, 0, []byte{})
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
			res := fc.SendBlheli(controller.BLHeliCmdDeviceInitFlash, 0, []byte{byte(esc)})
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
			res := fc.SendBlheli(controller.BLHeliCmdDeviceReset, 0, []byte{byte(esc)})
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
			fc.SendBlheli(controller.BLHeliCmdInterfaceExit, 0, []byte{})
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
		for {
			if err := fc.Run(); err != nil {
				log.Fatal(err)
			}
		}
	}()

	control(fc)
}
