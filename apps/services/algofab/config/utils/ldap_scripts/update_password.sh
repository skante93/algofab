#!/bin/bash

LDAP_UID="$1"
echo "UID : $LDAP_UID "

PASS="$2"
echo "Pass : $PASS"

PASS_W=$(sudo slappasswd -h {SSHA} -s $PASS)


cat <<EOF > "$LDAP_UID"-update_pass.ldif

dn: uid=$LDAP_UID,ou=users,dc=ldap,dc=algofab,dc=fr
changetype: modify
replace: userpassword
userpassword: $PASS_W

EOF

ldapmodify -x -D "cn=admin,dc=ldap,dc=algofab,dc=fr" -w pass -H ldap://ws37-cl2-en12 -f "$LDAP_UID"-update_pass.ldif

rm "$LDAP_UID"-update_pass.ldif
