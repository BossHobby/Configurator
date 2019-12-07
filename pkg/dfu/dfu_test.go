package dfu_test

import (
	"io/ioutil"
	"testing"

	"github.com/NotFastEnuf/configurator/pkg/dfu"
)

func TestDfuLoader(t *testing.T) {
	l, err := dfu.NewLoader()
	if err != nil {
		t.Fatal(err)
	}

	buf := make([]byte, 512*1024)
	if err := l.Read(buf); err != nil {
		t.Fatal(err)
	}
	if err := ioutil.WriteFile("test.bin", buf, 0755); err != nil {
		t.Fatal(err)
	}
	//log.Print(buf)
}
