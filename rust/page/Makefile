LIB_NAME := slsblog-page
BUILD_NAME := index.node
BUILD_DIR := native
DIST_NAME := page.node
LOCAL_BUILD_DIR := dist

all: build

build:
	docker build -t $(LIB_NAME) --rm=true .
	docker rm -fv $(LIB_NAME)-run; true
	docker run -it -d --name $(LIB_NAME)-run $(LIB_NAME)
	docker cp $(LIB_NAME)-run:/opt/buildrust/$(BUILD_DIR)/$(BUILD_NAME) .
	cp ./index.node ../../shared/bin/$(DIST_NAME)
	docker stop $(LIB_NAME)-run
	docker rm -fv $(LIB_NAME)-run

init:
	sudo docker build -t $(LIB_NAME) --rm=true .
	sudo docker run -it --name $(LIB_NAME)-run $(LIB_NAME) /bin/sh
	sudo docker cp $(LIB_NAME)-run:/usr/src/app/karma-conf.js .
	sudo docker stop $(LIB_NAME)-run
	sudo docker rm $(LIB_NAME)-run

test:
	sudo docker build -t $(LIB_NAME) --rm=true .
	sudo docker run -it --rm --name $(LIB_NAME)-run $(LIB_NAME) gulp test

cli:
	sudo docker build -t $(LIB_NAME) --rm=true .
	sudo docker run -it --rm --name $(LIB_NAME)-run $(LIB_NAME) /bin/bash

