#!/bin/bash


#. ./env.sh

# /echo "LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
# echo "LDAP_BASE_DN: $LDAP_BASE_DN"
# echo "LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
# echo "LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
# echo "LDAP_PASSWORD: $LDAP_PASSWORD"

if [ ! -d /data ]; then
	sudo mkdir /data
	sudo chown adm:adm /data
fi

if [ -f /data/dump.ldif ]; then
	echo "## Recovering DATA : ldapmodify -a -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif ##"
	ldapmodify -a -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif
fi

while [ true ];do
	echo "## Backing up : ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b ou=users,$LDAP_BASE_DN > /data/dump.ldif " 
	ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b ou=users,$LDAP_BASE_DN > /data/dump.ldif 
	sleep $(($LDAP_BACKUP_FREQ))  # 5minutes
done

