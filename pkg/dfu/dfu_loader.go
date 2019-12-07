package dfu

import (
	"time"
)

const wTransferSize = 2048

type Loader struct {
	dfu         DfuDevice
	pollTimeout time.Duration
}

func NewLoader() (*Loader, error) {
	d, err := Open()
	if err != nil {
		return nil, err
	}

	status, err := d.GetStatus()
	if err != nil {
		return nil, err
	}

	if status.State == DfuError {
		if err := d.ClrStatus(); err != nil {
			return nil, err
		}
		status, err = d.GetStatus()
		if err != nil {
			return nil, err
		}
	}

	l := &Loader{
		dfu:         d,
		pollTimeout: 5 * time.Millisecond,
	}
	if status.PollTimeout != 0 {
		l.pollTimeout = time.Duration(status.PollTimeout) * time.Millisecond
	}
	return l, nil
}

func (l *Loader) Read(data []byte) error {
	buf := make([]byte, wTransferSize)
	bytesRead, blockIndex := 0, 2

	for bytesRead < len(data) {
		if err := l.dfu.Upload(uint16(blockIndex), buf); err != nil {
			return err
		}
		copy(data[bytesRead:], buf)
		bytesRead += len(buf)
		blockIndex++

		time.Sleep(l.pollTimeout)
	}

	return nil
}
