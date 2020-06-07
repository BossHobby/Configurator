package quic

import (
	"io"
)

type QuicCommand uint8

const (
	QuicCmdInvalid QuicCommand = iota
	QuicCmdGet
	QuicCmdSet
	QuicCmdLog
	QuicCmdCalImu
	QuicCmdBlackbox
	QuicCmdMotor
	QuicCmdMax
)

const (
	QuicBlackboxReset = iota
	QuicBlackboxList
	QuicBlackboxGet
)

const (
	QuicMotorTestStatus = iota
	QuicMotorTestEnable
	QuicMotorTestDisable
	QuicMotorTestSetValue
	QuicMotorEsc4WayIf
)

const (
	QuicFlagNone uint8 = iota
	QuicFlagError
	QuicFlagStreaming
	QuicFlagExit
)

type QuicValue uint8

const (
	QuicValInvalid QuicValue = iota
	QuicValInfo
	QuicValProfile
	QuicValDefaultProfile
	QuicValState
	QuicValPidRatePresets
	QuicValVtxSettings
	QuicValOSDFont
	QuicValBLHeliSettings
)

type QuicPacket struct {
	cmd  QuicCommand
	flag uint8
	len  uint16

	Payload io.ReadCloser
}

const quicHeaderLen = uint16(4)
