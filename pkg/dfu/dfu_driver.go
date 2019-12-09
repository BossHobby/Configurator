package dfu

import (
	"github.com/google/gousb"
)

type Dfu struct {
	ctx       *gousb.Context
	dev       *gousb.Device
	iface     *gousb.Interface
	ifaceDone func()
}

const (
	reqDetach byte = iota
	reqDNLoad
	reqUpload
	reqGetStatus
	reqClearStatus
	reqGetState
	reqAbort
)

func Open() (*Dfu, error) {
	d := &Dfu{
		ctx: gousb.NewContext(),
	}

	dev, err := d.ctx.OpenDeviceWithVIDPID(dfuVendor, dfuProduct)
	if err != nil {
		d.Close()
		if err == gousb.ErrorNotFound {
			return nil, ErrDeviceNotFound
		}
		return nil, err
	}
	if dev == nil {
		d.Close()
		return nil, ErrDeviceNotFound
	}
	dev.ControlTimeout = 0
	d.dev = dev

	iface, ifaceDone, err := dev.DefaultInterface()
	if err != nil {
		d.Close()
		return nil, err
	}
	d.iface = iface
	d.ifaceDone = ifaceDone

	return d, nil
}

func (d *Dfu) Close() error {
	if d.ifaceDone != nil {
		d.ifaceDone()
	}
	if d.dev != nil {
		if err := d.dev.Close(); err != nil {
			return err
		}
	}
	if d.ctx != nil {
		if err := d.ctx.Close(); err != nil {
			return err
		}
	}
	return nil
}

func (d *Dfu) ClrStatus() error {
	_, err := d.dev.Control(0x21, reqClearStatus, 0, 0, nil)
	return err
}

func (d *Dfu) GetStatus() (*Status, error) {
	buf := make([]byte, 6)
	if _, err := d.dev.Control(0xa1, reqGetStatus, 0, 0, buf); err != nil {
		return nil, err
	}
	return &Status{
		Status:      StatusCode(buf[0]),
		PollTimeout: uint32(buf[1]<<16 | buf[2]<<8 | buf[3]),
		State:       State(buf[4]),
		IString:     buf[5],
	}, nil
}

func (d *Dfu) GetState() (State, error) {
	buf := make([]byte, 1)
	_, err := d.dev.Control(0xa1, reqGetState, 0, 0, buf)
	if err != nil {
		return 0, err
	}
	return State(buf[0]), nil
}

func (d *Dfu) Upload(blockNumber uint16, buf []byte) error {
	_, err := d.dev.Control(0xa1, reqUpload, blockNumber, 0, buf)
	return err
}

func (d *Dfu) Dnload(blockNumber uint16, buf []byte) error {
	_, err := d.dev.Control(0x21, reqDNLoad, blockNumber, 0, buf)
	return err
}

func (d *Dfu) Abort() error {
	_, err := d.dev.Control(0x21, reqAbort, 0, 0, nil)
	return err
}
