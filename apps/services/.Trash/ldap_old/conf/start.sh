#!/bin/bash
#set -e

#sudo chown -R adm:adm $(pwd)

if [ "$LDAP_SERVER_NAME" == "" ]; then
	LDAP_SERVER_NAME="Algofab LDAP Server"
fi

if [ "$LDAP_BASE_DN" == "" ]; then
	LDAP_BASE_DN="dc=ldap,dc=algofab,dc=fr"
fi

if [ "$LDAP_DEBCONF_DOMAIN" == "" ]; then
	LDAP_DEBCONF_DOMAIN="ldap.algofab.fr"
fi

if [ "$LDAP_DEBCONF_ORG" == "" ]; then
	LDAP_DEBCONF_ORG="TeraLab IMT"
fi

if [ "$LDAP_PASSWORD" == "" ]; then
	LDAP_PASSWORD="password"
fi

if [ "$LDAP_BACKUP_FREQ" == "" ]; then
	LDAP_BACKUP_FREQ=300
fi

echo "#!/bin/bash" | sudo tee env.sh

echo "-*- LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
echo "LDAP_SERVER_NAME=\"$LDAP_SERVER_NAME\"" | sudo tee -a env.sh

echo "-*- LDAP_BASE_DN: $LDAP_BASE_DN"
echo "LDAP_BASE_DN=\"$LDAP_BASE_DN\"" | sudo tee -a env.sh

echo "-*- LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
echo "LDAP_DEBCONF_DOMAIN=\"$LDAP_DEBCONF_DOMAIN\"" | sudo tee -a env.sh

echo "-*- LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
echo "LDAP_DEBCONF_ORG=\"$LDAP_DEBCONF_ORG\"" | sudo tee -a env.sh

echo "-*- LDAP_PASSWORD: $LDAP_PASSWORD"
echo "LDAP_PASSWORD=\"$LDAP_PASSWORD\"" | sudo tee -a env.sh

echo "-*- LDAP_BACKUP_FREQ: $LDAP_BACKUP_FREQ"
echo "LDAP_BACKUP_FREQ=$LDAP_BACKUP_FREQ" | sudo tee -a env.sh

sudo ./main.sh
. ./recover.sh

while [ true ];do echo "Alive"; sleep 3600; done