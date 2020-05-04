#!/bin/bash


# echo "install_ldap: LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
# echo "install_ldap: LDAP_BASE_DN: $LDAP_BASE_DN"
# echo "install_ldap: LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
# echo "install_ldap: LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
# echo "install_ldap: LDAP_PASSWORD: $LDAP_PASSWORD"


cat <<EOF | debconf-set-selections
slapd slapd/internal/adminpw password $LDAP_PASSWORD 
slapd slapd/internal/generated_adminpw password $LDAP_PASSWORD
slapd slapd/password2 password $LDAP_PASSWORD
slapd slapd/password1 password $LDAP_PASSWORD
slapd slapd/dump_database_destdir string /var/backups/slapd-VERSION
slapd slapd/domain string $LDAP_DEBCONF_DOMAIN
slapd shared/organization string $LDAP_DEBCONF_ORG
slapd slapd/backend string HDB
slapd slapd/purge_database boolean true
slapd slapd/move_old_database boolean true
slapd slapd/allow_ldap_v2 boolean false
slapd slapd/no_configuration boolean false
slapd slapd/dump_database string when needed
EOF

#cat dconf | debconf-set-selections

apt-get install -y slapd ldap-utils