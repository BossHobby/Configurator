package dfu

import (
	"errors"
	"strconv"
)

const (
	dfuVendor  = 0x0483
	dfuProduct = 0xdf11
)

type StatusCode int

const (
	StatusOk StatusCode = iota
	ErrTarget
	ErrFile
	ErrWrite
	ErrErase
	ErrCheckErased
	ErrProgram
	ErrVerify
	ErrAddress
	ErrNotDone
	ErrFirmware
	ErrVendor
	ErrUsbR
	ErrPOR
	ErrUnknown
	ErrStalledPkt
)

func (s StatusCode) String() string {
	switch s {
	case StatusOk:
		return "StatusOk"
	case ErrTarget:
		return "ErrTarget"
	case ErrFile:
		return "ErrFile"
	case ErrWrite:
		return "ErrWrite"
	case ErrErase:
		return "ErrErase"
	case ErrCheckErased:
		return "ErrCheckErased"
	case ErrProgram:
		return "ErrProgram"
	case ErrVerify:
		return "ErrVerify"
	case ErrAddress:
		return "ErrAddress"
	case ErrNotDone:
		return "ErrNotDone"
	case ErrFirmware:
		return "ErrFirmware"
	case ErrVendor:
		return "ErrVendor"
	case ErrUsbR:
		return "ErrUsbR"
	case ErrPOR:
		return "ErrPOR"
	case ErrUnknown:
		return "ErrUnknown"
	case ErrStalledPkt:
		return "ErrStalledPkt"
	}
	return strconv.Itoa(int(s))
}

type State int

const (
	AppIdle State = iota
	AppDetach
	DfuIdle
	DfuDownloadSync
	DfuDownloadBusy
	DfuDownloadIdle
	DfuManifestSync
	DfuManifest
	DfuManifestWaitReset
	DfuUploadIdle
	DfuError
)

func (s State) String() string {
	switch s {
	case AppIdle:
		return "AppIdle"
	case AppDetach:
		return "AppDetach"
	case DfuIdle:
		return "DfuIdle"
	case DfuDownloadSync:
		return "DfuDownloadSync"
	case DfuDownloadBusy:
		return "DfuDownloadBusy"
	case DfuDownloadIdle:
		return "DfuDownloadIdle"
	case DfuManifestSync:
		return "DfuManifestSync"
	case DfuManifest:
		return "DfuManifest"
	case DfuManifestWaitReset:
		return "DfuManifestWaitReset"
	case DfuUploadIdle:
		return "DfuUploadIdle"
	case DfuError:
		return "DfuError"
	}
	return strconv.Itoa(int(s))
}

type Status struct {
	Status      StatusCode
	PollTimeout uint32
	State       State
	IString     uint8
}

type DfuDevice interface {
	Close() error
	GetStatus() (*Status, error)
	ClrStatus() error
	Upload(blockNumber uint16, buf []byte) error
}

var ErrDeviceNotFound = errors.New("dfu device not found")
