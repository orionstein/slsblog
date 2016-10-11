.PHONY: all test clean

build: 
	elm make main/Main.elm post/Main.elm --output elm-app.js

deploy: build
	aws s3 sync . s3://sls-blog-admin

all: build
