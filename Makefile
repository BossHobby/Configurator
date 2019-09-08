EXECUTABLE=usb_configurator
GO111MODULE=on

WINDOWS	= $(EXECUTABLE)_windows_amd64.exe
LINUX		= $(EXECUTABLE)_linux_amd64
DARWIN	= $(EXECUTABLE)_darwin_amd64

VERSION 		= $(shell git describe --tags --always --long --dirty)

ifeq ($(OS), Windows_NT)
	PLATFORM=windows
else
	OS := $(shell uname)
	ifeq ($(OS), Darwin)
		PLATFORM=darwin
	else
		PLATFORM=linux
	endif
endif

MODE ?= release
ifeq ($(MODE), debug)
	MODE = debug
else
	MODE = release
endif

BUILD_FLAGS = -ldflags="-X main.version=$(VERSION) -X main.mode=$(MODE)"

.PHONY: all clean web $(EXECUTABLE)_$(PLATFORM)_amd64
all: windows linux darwin
	@echo version: $(VERSION)

windows: $(WINDOWS)
$(WINDOWS): cmd/server/statik
	env GOOS=windows GOARCH=amd64 go build $(BUILD_FLAGS) -o $(WINDOWS) ./cmd/server

linux: $(LINUX)
$(LINUX): cmd/server/statik
	env GOOS=linux GOARCH=amd64 go build $(BUILD_FLAGS) -o $(LINUX) ./cmd/server

darwin: $(DARWIN)
$(DARWIN): cmd/server/statik
	env GOOS=darwin GOARCH=amd64 go build $(BUILD_FLAGS) -o $(DARWIN) ./cmd/server

serve-web:
	npm --prefix web run serve

serve-reload:
	CompileDaemon -build="make MODE=debug $(PLATFORM)" -command="./$(EXECUTABLE)_$(PLATFORM)_amd64"

web/node_modules: web/package.json
	npm --prefix web install

web: web/dist
web/dist: web/node_modules
	npm --prefix web run build

cmd/server/statik: web/dist
	go generate ./...

clean:
	rm -rf web/node_modules web/dist
	rm -rf cmd/server/statik
	rm -f $(WINDOWS) $(LINUX) $(DARWIN)