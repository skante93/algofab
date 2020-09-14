
FROM ubuntu

# ENV LDAP_SERVER_NAME="Algofab LDAP Server"
# ENV LDAP_BASE_DN="dc=ldap,dc=algofab,dc=fr"
# ENV LDAP_DEBCONF_DOMAIN="ldap.algofab.fr"
# ENV LDAP_DEBCONF_ORG="TeraLab IMT"
# ENV LDAP_PASSWORD="password"
# ENV LDAP_BACKUP_FREQ=300

ENV DEBIAN_FRONTEND='non-interactive'
RUN apt-get update && apt-get install -y rsyslog sudo

# RUN echo "slapd slapd/internal/adminpw password $LDAP_PASSWORD" | debconf-set-selections 
# RUN echo "slapd slapd/internal/generated_adminpw password $LDAP_PASSWORD" | debconf-set-selections
# RUN echo "slapd slapd/password2 password $LDAP_PASSWORD" | debconf-set-selections
# RUN echo "slapd slapd/password1 password $LDAP_PASSWORD" | debconf-set-selections
# RUN echo "slapd slapd/dump_database_destdir string /var/backups/slapd-VERSION" | debconf-set-selections
# RUN echo "slapd slapd/domain string $LDAP_DEBCONF_DOMAIN" | debconf-set-selections
# RUN echo "slapd shared/organization string $LDAP_DEBCONF_ORG" | debconf-set-selections
# RUN echo "slapd slapd/backend string HDB" | debconf-set-selections
# RUN echo "slapd slapd/purge_database boolean true" | debconf-set-selections
# RUN echo "slapd slapd/move_old_database boolean true" | debconf-set-selections
# RUN echo "slapd slapd/allow_ldap_v2 boolean false" | debconf-set-selections
# RUN echo "slapd slapd/no_configuration boolean false" | debconf-set-selections
# RUN echo "slapd slapd/dump_database string when needed" | debconf-set-selections

RUN apt-get install -y slapd ldap-utils

# RUN echo "base    $LDAP_BASE_DN" > /etc/ldap/ldap.conf
# RUN echo "uri     ldap://" >> /etc/ldap/ldap.conf
# RUN echo "ssl     no" >> /etc/ldap/ldap.conf
# RUN echo "pam_password    md5" >> /etc/ldap/ldap.conf
# RUN echo "#TLS_CACERT      /etc/ssl/certs/ca-certificates.crt" >> /etc/ldap/ldap.conf
# RUN echo "nss_initgroups_ignoreusers root,ldap,named,avahi,haldaemon,dbus,radvd,tomcat,radiusd,news,mailman,nscd,gdm" >> /etc/ldap/ldap.conf

# RUN dpkg-reconfigure -f noninteractive slapd


RUN apt-get install -y phpldapadmin

# RUN echo "ServerName ldap" >> /etc/apache2/apache2.conf

# RUN echo "<?php" > /etc/phpldapadmin/config.php
# RUN echo "	\$config->custom->appearance['hide_template_warning'] = true;" >> /etc/phpldapadmin/config.php

# RUN echo "	\$config->custom->appearance['friendly_attrs'] = array(" >> /etc/phpldapadmin/config.php
# RUN echo "		'facsimileTelephoneNumber' => 'Fax'," >> /etc/phpldapadmin/config.php
# RUN echo "		'gid'                      => 'Group'," >> /etc/phpldapadmin/config.php
# RUN echo "		'mail'                     => 'Email'," >> /etc/phpldapadmin/config.php
# RUN echo "		'telephoneNumber'          => 'Telephone'," >> /etc/phpldapadmin/config.php
# RUN echo "		'uid'                      => 'User Name'," >> /etc/phpldapadmin/config.php
# RUN echo "		'userPassword'             => 'Password'" >> /etc/phpldapadmin/config.php
# RUN echo "	);" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers = new Datastore();" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers->newServer('ldap_pla');" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers->setValue('server','name','$LDAP_SERVER_NAME');" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers->setValue('server','host','ldap://');" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers->setValue('server','base',array('$LDAP_BASE_DN'));" >> /etc/phpldapadmin/config.php
# RUN echo "	\$servers->setValue('login','auth_type','session');" >> /etc/phpldapadmin/config.php
# RUN echo "?>" >> /etc/phpldapadmin/config.php


# RUN useradd -u 1001 -g adm -m -s /bin/bash adm
# RUN echo "adm:passwd" | chpasswd
# RUN echo "adm	ALL=(root)	NOPASSWD:ALL" > /etc/sudoers.d/adm

# USER adm
# WORKDIR /home/adm
COPY conf/functions.php /usr/share/phpldapadmin/lib/functions.php
COPY conf/entrypoint.sh /tmp/

WORKDIR /tmp

ENTRYPOINT ./entrypoint.sh

# COPY conf/* /setup/

# WORKDIR /setup

# ENTRYPOINT ./start.sh

# VOLUME ["/etc/ldap", "/var/lib/ldap"]

# #RUN echo "*/1 *	* * *	root	echo \"test \`date\`\" >> /root/test_cron.txt" >> /var/spool/cron/crontabs/root

# EXPOSE 389 

# EXPOSE 80
