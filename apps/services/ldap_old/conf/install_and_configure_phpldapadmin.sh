#!/bin/bash


# echo "install_and_configure_phpldapadmin: LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
# echo "install_and_configure_phpldapadmin: LDAP_BASE_DN: $LDAP_BASE_DN"
# echo "install_and_configure_phpldapadmin: LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
# echo "install_and_configure_phpldapadmin: LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
# echo "install_and_configure_phpldapadmin: LDAP_PASSWORD: $LDAP_PASSWORD"

export DEBIAN_FRONTEND='non-interactive'
apt-get install -y phpldapadmin

#dpkg -i phpldapadmin_1.2.2-6.1_all.deb

#apt-get -f install

echo "ServerName ldap" >> /etc/apache2/apache2.conf

cat <<EOF > /etc/phpldapadmin/config.php
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

\$servers->setValue('server','host','ldap://$(hostname --ip)');

\$servers->setValue('server','base',array('$LDAP_BASE_DN'));

\$servers->setValue('login','auth_type','session');

?>
EOF

source /etc/apache2/envvars

cp functions.php /usr/share/phpldapadmin/lib/functions.php

service apache2 restart