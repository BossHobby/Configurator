package dfu

import (
	"errors"
	"time"

	"github.com/google/gousb"
	log "github.com/sirupsen/logrus"
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

func (l *Loader) Read(data []byte, progress func(total, current int)) error {
	buf := make([]byte, wTransferSize)
	bytesRead, blockIndex := 0, 2

	for bytesRead < len(data) {
		if err := l.dfu.Upload(uint16(blockIndex), buf); err != nil {
			return err
		}
		copy(data[bytesRead:], buf)
		bytesRead += len(buf)
		blockIndex++

		if progress != nil {
			progress(len(data), bytesRead)
		}

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

func (l *Loader) applyStatus() (*Status, error) {
	// apply
	if _, err := l.dfu.GetStatus(); err != nil {
		return nil, err
	}

	// check
	return l.dfu.GetStatus()
}

func (l *Loader) SetAddress(address uint32) error {
	cmd := []byte{
		0x21,
		byte(address),
		byte((address >> 8)),
		byte((address >> 16)),
		byte((address >> 24)),
	}
	if err := l.dfu.Dnload(0, cmd); err != nil {
		return err
	}

	s, err := l.applyStatus()
	if err != nil {
		return err
	}
	if s.State != DfuDownloadIdle {
		return errors.New("invalid state")
	}

	return nil
}

func (l *Loader) MassErase() error {
	cmd := []byte{
		0x41,
	}
	log.Trace("start mass-erase download")
	if err := l.dfu.Dnload(0, cmd); err != nil {
		return err
	}
	log.Trace("waiting mass-erase download")
	time.Sleep(10 * time.Second)

applyLabel:
	log.Trace("applying status")
	s, err := l.applyStatus()
	if err != nil {
		log.Debug("apply status error ", err)
		if err == gousb.ErrorTimeout || err == gousb.ErrorPipe {
			log.Trace("retrying apply status mass-erase download")
			time.Sleep(1 * time.Second)
			goto applyLabel
		}
		return err
	}
	if s.State != DfuDownloadIdle {
		return errors.New("invalid state")
	}

	return nil
}

func (l *Loader) Write(data []byte, progress func(total, current int)) error {
	bytesWritten, blockIndex := 0, 2

	for bytesWritten < len(data) {
		end := bytesWritten + wTransferSize
		if end > len(data) {
			end = len(data)
		}

		buf := data[bytesWritten:end]
		if err := l.dfu.Dnload(uint16(blockIndex), buf); err != nil {
			return err
		}

		s, err := l.applyStatus()
		if err != nil {
			return err
		}
		if s.State != DfuDownloadIdle {
			return errors.New("invalid state")
		}

		bytesWritten += wTransferSize
		blockIndex++

		if progress != nil {
			progress(len(data), bytesWritten)
		}

		time.Sleep(l.pollTimeout)
	}

	time.Sleep(l.pollTimeout)
	return nil
}

func (l *Loader) Leave() error {
	if err := l.dfu.Dnload(0, []byte{}); err != nil {
		return err
	}
	time.Sleep(500 * time.Millisecond)
	return nil
}

func (l *Loader) Close() error {
	return l.dfu.Close()
}
