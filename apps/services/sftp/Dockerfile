
#ENV SFTP_PUB_KEYS # Public ssh keys separated by a ","
#ENV SFTP_DATA_DIR # Mount point of data volume, by default data are assumed to have been mounted on "/live-data"

FROM ubuntu

RUN apt-get update && apt-get upgrade -y 

RUN apt-get install -y rsyslog openssh-server

COPY sshd_config /etc/ssh/

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT /entrypoint.sh
