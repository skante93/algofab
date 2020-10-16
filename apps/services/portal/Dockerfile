
FROM ubuntu

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y nodejs npm curl

RUN npm install -g n

RUN n stable

RUN npm install -g @angular/cli

WORKDIR /root/server

CMD ng serve --host 0.0.0.0
