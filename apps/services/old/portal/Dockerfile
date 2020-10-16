FROM ubuntu:18.04

EXPOSE 4200

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y sudo curl nodejs npm

RUN npm install -g n && n stable

RUN npm install -g @angular/cli

RUN useradd -m skante

RUN echo "skante ALL=(ALL) NOPASSWD: ALL"> /etc/sudoers.d/skante

USER skante

WORKDIR /home/skante/server



CMD ng serve --disable-host-check


