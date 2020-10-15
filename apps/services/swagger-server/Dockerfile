FROM ubuntu

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get upgrade -y 

RUN apt-get install -y nodejs npm curl

RUN npm install -g supervisor n

RUN n stable

WORKDIR /root/server

CMD supervisor app.js
