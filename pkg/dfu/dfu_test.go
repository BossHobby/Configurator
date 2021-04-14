package dfu_test

import (
	"io/ioutil"
	"testing"

	"github.com/BossHobby/configurator/pkg/dfu"
)

func TestDfuLoader(t *testing.T) {
	l, err := dfu.NewLoader()
	if err != nil {
		t.Fatal(err)
	}

	input, err := ioutil.ReadFile("test.bin")
	if err != nil {
		t.Fatal(err)
	}

	if err := l.EnterState(dfu.DfuIdle); err != nil {
		t.Fatal(err)
	}

	if err := l.SetAddress(0x08000000); err != nil {
		t.Fatal(err)
	}

	if err := l.MassErase(); err != nil {
		t.Fatal(err)
	}

	if err := l.Write(input, nil); err != nil {
		t.Fatal(err)
	}
	//log.Print(buf)
}
