#! /bin/bash
docker run -it --rm -v $(pwd):/src hanfer/xgo-libusb:latest /run-env.sh windows make MODE=debug windows