.PHONY: all test clean

build: 
	elm make main/Main.elm post/Main.elm --output elm-app.js

all: build
