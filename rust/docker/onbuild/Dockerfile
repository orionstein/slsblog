FROM orionstein/rustbuilder:latest

WORKDIR /opt/buildrust

RUN npm install -g yarn

ONBUILD ADD . /opt/buildrust/

ONBUILD RUN yarn install

ONBUILD RUN neon build

CMD ["bash"]
