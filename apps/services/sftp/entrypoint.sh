#!/bin/bash

SSH_DIR="/root/.ssh"
DATA_DIR="${SFTP_DATA_DIR:-/live-data}"


mkdir -p $SSH_DIR

INIT_IFS=$IFS
IFS=$(echo -en "\n\b")

for key in `echo $SFTP_PUB_KEYS | tr "," "\n"`;
do
	echo "Found key : $key"
	echo $key >> $SSH_DIR/authorized_keys
done

IFS=$INIT_IFS


cat << EOF >> /etc/ssh/sshd_config

Subsystem sftp internal-sftp
       ChrootDirectory $DATA_DIR
       AllowTCPForwarding yes

EOF


chown root:root $DATA_DIR

service rsyslog start

service ssh start

while [ true ] ; do printf "%s\r" "Running"; sleep 3600; done
