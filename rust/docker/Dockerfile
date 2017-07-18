FROM amazonlinux:latest


RUN mkdir /opt/buildrust

RUN yum update -y \
  && curl --silent --location https://rpm.nodesource.com/setup_4.x | bash - \
  && yum install -y nodejs make gcc-c++ git curl file sudo \
  && curl -sf https://static.rust-lang.org/rustup.sh | sh \
  && npm install -g npm \
  && npm install -g neon neon-cli \
