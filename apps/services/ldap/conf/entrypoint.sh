#!/bin/bash

set -e

FIRST_TIME=true

if [ "$LDAP_SERVER_NAME" == "" ]; then
	LDAP_SERVER_NAME="Algofab LDAP Server"
fi
#echo "LDAP_SERVER_NAME=\"$LDAP_SERVER_NAME\"" > env

if [ "$LDAP_BASE_DN" == "" ]; then
	LDAP_BASE_DN="dc=ldap,dc=algofab,dc=fr"
fi
#echo "LDAP_BASE_DN=\"$LDAP_BASE_DN\"" >> env

if [ "$LDAP_DEBCONF_DOMAIN" == "" ]; then
	LDAP_DEBCONF_DOMAIN="ldap.algofab.fr"
fi
#echo "LDAP_DEBCONF_DOMAIN=\"$LDAP_DEBCONF_DOMAIN\"" >> env

if [ "$LDAP_DEBCONF_ORG" == "" ]; then
	LDAP_DEBCONF_ORG="TeraLab IMT"
fi
#echo "LDAP_DEBCONF_ORG=\"$LDAP_DEBCONF_ORG\"" >> env

if [ "$LDAP_PASSWORD" == "" ]; then
	LDAP_PASSWORD="pass"
fi
#echo "LDAP_PASSWORD=\"$LDAP_PASSWORD\"" >> env

if [ "$LDAP_MAIN_FREQ" == "" ]; then
	LDAP_MAIN_FREQ=300 # 5 minutes
fi

service rsyslog start

export DEBIAN_FRONTEND="noninteractive"

function dump_ldif(){
	if [ ! -d /data ]; then
		mkdir /data
		#sudo chown adm:adm /data
	fi

	echo "## Backing up : ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b ou=users,$LDAP_BASE_DN > /data/dump.ldif " 
	ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b $LDAP_BASE_DN > /data/dump.ldif 
}

function configure_ldap(){
	
	echo "slapd slapd/internal/adminpw password $LDAP_PASSWORD" | debconf-set-selections 
	echo "slapd slapd/internal/generated_adminpw password $LDAP_PASSWORD" | debconf-set-selections
	echo "slapd slapd/password2 password $LDAP_PASSWORD" | debconf-set-selections
	echo "slapd slapd/password1 password $LDAP_PASSWORD" | debconf-set-selections
	echo "slapd slapd/dump_database_destdir string /var/backups/slapd-VERSION" | debconf-set-selections
	echo "slapd slapd/domain string $LDAP_DEBCONF_DOMAIN" | debconf-set-selections
	echo "slapd shared/organization string $LDAP_DEBCONF_ORG" | debconf-set-selections
	echo "slapd slapd/backend string HDB" | debconf-set-selections
	echo "slapd slapd/purge_database boolean true" | debconf-set-selections
	echo "slapd slapd/move_old_database boolean true" | debconf-set-selections
	echo "slapd slapd/allow_ldap_v2 boolean false" | debconf-set-selections
	echo "slapd slapd/no_configuration boolean false" | debconf-set-selections
	echo "slapd slapd/dump_database string when needed" | debconf-set-selections

	cat <<-EOF > /etc/ldap/ldap.conf
	base    $LDAP_BASE_DN
	uri     ldap://$(hostname --ip)
	ssl     no
	pam_password    md5
	#TLS_CACERT      /etc/ssl/certs/ca-certificates.crt
	nss_initgroups_ignoreusers root,ldap,named,avahi,haldaemon,dbus,radvd,tomcat,radiusd,news,mailman,nscd,gdm
	EOF

	
	echo " ... Reconfiguring LDAP ... "
	sudo dpkg-reconfigure -f noninteractive slapd
	echo " ... Reconfiguration of LDAP Done ... "

	sudo service slapd restart

	echo "PASSWORD = $LDAP_PASSWORD"

	HASHED_PASSWORD=`slappasswd -s $LDAP_PASSWORD`

	DB=`ldapsearch -H ldapi:/// -Y EXTERNAL -b "cn=config" -LLL -Q "olcDatabase=*" dn | grep {1}`
	# echo "... MY CURRENT DB IS $DB"

	if [ "$DB" == "dn: olcDatabase={1}mdb,cn=config" ]; then
		DB="mdb"
	elif [ "$DB" == "dn: olcDatabase={1}hdb,cn=config" ]; then
		DB="hdb"
	else
		DB="bdb"
	fi
	# echo "... MY CURRENT DB IS $DB"

	cat <<-EOF > init.ldif 
	dn: olcDatabase={1}$DB,cn=config
	changetype: modify
	replace: olcRootPW
	olcRootPW: $HASHED_PASSWORD

	dn: olcDatabase={1}$DB,cn=config
	add: olcAccess
	olcAccess: {0}to attrs=userPassword,shadowLastChange by dn="cn=admin,$LDAP_BASE_DN" write by anonymous auth by self write by * none
	olcAccess: {1}to dn.subtree="" by * read
	olcAccess: {2}to * by dn="cn=admin,$LDAP_BASE_DN" write by * read

	dn: olcDatabase={-1}frontend,cn=config
	changetype: modify
	delete: olcAccess

	dn: olcDatabase={0}config,cn=config
	changetype: modify
	add: olcRootDN
	olcRootDN: cn=admin,cn=config

	dn: olcDatabase={0}config,cn=config
	changetype: modify
	add: olcRootPW
	olcRootPW: $HASHED_PASSWORD
	EOF

	ldapmodify -Y EXTERNAL -H ldapi:/// -f init.ldif
	#ldapmodify -Y EXTERNAL -H ldapi:/// -f init.ldif

	echo " ... Restoring data ... "
	
	if [ -f /data/dump.ldif ]; then
		echo "## Recovering DATA : ldapmodify -a -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif ##"
		ldapmodify -a -c -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif &
	fi

	echo "done with LDAP configuration"
}

function configure_phpldaladmin(){
	echo "ServerName ldap" >> /etc/apache2/apache2.conf

	cat <<-EOF > /etc/phpldapadmin/config.php
	<?php
		\$config->custom->appearance['hide_template_warning'] = true;

		\$config->custom->appearance['friendly_attrs'] = array(
			'facsimileTelephoneNumber' => 'Fax',
			'gid'                      => 'Group',
			'mail'                     => 'Email',
			'telephoneNumber'          => 'Telephone',
			'uid'                      => 'User Name',
			'userPassword'             => 'Password'
		);
		\$servers = new Datastore();
		\$servers->newServer('ldap_pla');
		\$servers->setValue('server','name','$LDAP_SERVER_NAME');
		\$servers->setValue('server','host','ldap://');
		\$servers->setValue('server','base',array('$LDAP_BASE_DN'));
		\$servers->setValue('login','auth_type','session');
	?>
	EOF

	source /etc/apache2/envvars
	sudo service apache2 restart
}

function echo_vars(){
	echo "-*- LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
	echo "-*- LDAP_BASE_DN: $LDAP_BASE_DN"
	echo "-*- LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
	echo "-*- LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
	echo "-*- LDAP_PASSWORD: $LDAP_PASSWORD"
	echo "-*- LDAP_MAIN_FREQ: $LDAP_MAIN_FREQ"
}

function init(){
	echo_vars

	
	#echo "LDAP_MAIN_FREQ=\"$LDAP_MAIN_FREQ\"" >> env
	
	OLD_CONF=""

	while true; 
	do
		CONF=$(cat <<-EOF
		LDAP_SERVER_NAME="$LDAP_SERVER_NAME"
		LDAP_BASE_DN="$LDAP_BASE_DN"
		LDAP_DEBCONF_DOMAIN="$LDAP_DEBCONF_DOMAIN"
		LDAP_DEBCONF_ORG="$LDAP_DEBCONF_ORG"
		LDAP_PASSWORD="$LDAP_PASSWORD"
		LDAP_MAIN_FREQ="$LDAP_MAIN_FREQ"
		EOF
		)

		if [ "$CONF" = "$OLD_CONF" ]
		then
			echo -e "Nothing to be done\r"
		else
			echo -e "Yep gottta do something\r"
			
			configure_ldap
			
			configure_phpldaladmin

			FIRST_TIME=false
			
			OLD_CONF="$CONF"
		fi

		dump_ldif

		sleep $(($LDAP_MAIN_FREQ)) 
	done 
}

init