
FROM python:3

RUN pip3 install pillow

COPY code/ /app

WORKDIR /app

RUN mkdir /outputs

ENTRYPOINT ./main.py