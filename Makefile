EXECUTABLE=usb_configurator
GO111MODULE=on

WINDOWS	= $(EXECUTABLE)_windows_amd64
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

windows: $(WINDOWS).zip
$(WINDOWS).zip: $(WINDOWS).exe
	@zip -r $(WINDOWS).zip $(WINDOWS).exe

$(WINDOWS).exe: $(WINDOWS).syso cmd/server/statik
	env GOOS=windows GOARCH=amd64 go build $(BUILD_FLAGS) -o $(WINDOWS).exe ./cmd/server

$(WINDOWS).syso: web/public/favicon.ico
	go get github.com/akavel/rsrc
	rsrc -ico web/public/favicon.ico -o $(WINDOWS).syso

linux: $(LINUX).zip
$(LINUX).zip: $(LINUX)
	@zip -r $(LINUX).zip $(LINUX)

$(LINUX): cmd/server/statik
	env GOOS=linux GOARCH=amd64 go build $(BUILD_FLAGS) -o $(LINUX) ./cmd/server

darwin: $(DARWIN).zip
$(DARWIN).zip: $(DARWIN).app
	@zip -r $(DARWIN).zip $(DARWIN).app

$(DARWIN).app: $(DARWIN)
	appify -name "$(DARWIN)" -icon ./web/src/assets/logo.png $(DARWIN)

$(DARWIN): cmd/server/statik
	env GOOS=darwin GOARCH=amd64 go build $(BUILD_FLAGS) -o $(DARWIN) ./cmd/server

serve-web:
	npm --prefix web run serve

serve-reload:
	CompileDaemon -build="make MODE=debug $(PLATFORM)" -command="./$(EXECUTABLE)_$(PLATFORM)_amd64"

web/node_modules: web/package.json
	cd web && npm install && cd ..

web: web/dist
web/dist: web/node_modules
	cd web && npm run build && cd ..

cmd/server/statik: web/dist
	@go get github.com/rakyll/statik
	@go generate ./...

clean:
	@rm -rf web/node_modules web/dist || true
	@rm -rf cmd/server/statik || true
	@rm -r $(WINDOWS)* $(LINUX)* $(DARWIN)* || true