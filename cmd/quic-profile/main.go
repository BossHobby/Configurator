package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/fxamacker/cbor/v2"
)

func main() {
	flag.Parse()

	if flag.NArg() != 1 {
		fmt.Println("must supply <filename>")
		flag.Usage()
		os.Exit(1)
	}

	filename := flag.Arg(0)

	f, err := os.Open(filename)
	if err != nil {
		log.Fatal(err)
	}

	var profile map[string]interface{}
	if err := cbor.NewDecoder(f).Decode(&profile); err != nil {
		log.Fatal(err)
	}

	log.Printf("%+v\n", profile)

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(profile); err != nil {
		log.Fatal(err)
	}
}
