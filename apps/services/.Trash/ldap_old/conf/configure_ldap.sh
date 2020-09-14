#!/bin/bash

# echo "configure_ldap: LDAP_SERVER_NAME: $LDAP_SERVER_NAME"
# echo "configure_ldap: LDAP_BASE_DN: $LDAP_BASE_DN"
# echo "configure_ldap: LDAP_DEBCONF_DOMAIN: $LDAP_DEBCONF_DOMAIN"
# echo "configure_ldap: LDAP_DEBCONF_ORG: $LDAP_DEBCONF_ORG"
# echo "configure_ldap: LDAP_PASSWORD: $LDAP_PASSWORD"

HASHED_PASSWORD=`slappasswd -s $LDAP_PASSWORD`

cat << EOF > /etc/ldap/ldap.conf
base    $LDAP_BASE_DN
uri     ldap://$(hostname --ip)
ssl     no
pam_password    md5
#TLS_CACERT      /etc/ssl/certs/ca-certificates.crt
nss_initgroups_ignoreusers root,ldap,named,avahi,haldaemon,dbus,radvd,tomcat,radiusd,news,mailman,nscd,gdm
EOF

dpkg-reconfigure -f noninteractive slapd

service slapd start


cat <<EOF | sudo tee init.ldif
dn: olcDatabase={1}hdb,cn=config
changetype: modify
replace: olcRootPW
olcRootPW: $HASHED_PASSWORD

dn: olcDatabase={1}hdb,cn=config
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