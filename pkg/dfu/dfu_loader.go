package dfu

import (
	"time"
)

const wTransferSize = 2048

type Loader struct {
	dfu         *Dfu
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

	time.Sleep(l.pollTimeout)
	return nil
}

func (l *Loader) Alive() error {
	_, err := l.dfu.GetStatus()
	return err
}

func (l *Loader) EnterState(state State) error {
	for {
		s, err := l.dfu.GetState()
		if err != nil {
			return err
		}

		if state == s {
			break
		}

		switch s {
		case DfuUploadIdle, DfuDownloadIdle:
			if err := l.dfu.Abort(); err != nil {
				return err
			}
			break
		default:
			time.Sleep(100 * time.Millisecond)
			break
		}
	}
	return nil
}

func (l *Loader) Write(data []byte) error {
	bytesWritten, blockIndex := 0, 2

	for bytesWritten < len(data) {
		if err := l.dfu.Upload(uint16(blockIndex), data[bytesWritten:bytesWritten+wTransferSize]); err != nil {
			return err
		}
		bytesWritten += wTransferSize
		blockIndex++

		time.Sleep(l.pollTimeout)
	}

	time.Sleep(l.pollTimeout)
	return nil
}

func (l *Loader) Leave() error {
	if err := l.dfu.Dnload(0, []byte{}); err != nil {
		return err
	}
	return nil
}

func (l *Loader) Close() error {
	return l.dfu.Close()
}
