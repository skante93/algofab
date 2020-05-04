FROM ruby:2.3-alpine
COPY . /usr/src/app
VOLUME /usr/src/app
EXPOSE 4567

WORKDIR /usr/src/app

RUN apk add sudo


RUN adduser -u 1001 -h /home/admin -S admin && echo "admin:admin" | chpasswd
RUN echo "admin	ALL=(root)	NOPASSWD:ALL" > /etc/sudoers.d/admin 

USER admin

RUN sudo apk add --update nodejs g++ make
RUN bundle install

CMD ["bundle", "exec", "middleman", "server", "--watcher-force-polling"]
