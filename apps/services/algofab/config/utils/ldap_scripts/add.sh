#!/bin/bash

FIRSTNAME="$1"
echo "Firstname : $FIRSTNAME "

LASTNAME="$2"
echo "Lastname : $LASTNAME "

MAIL="$3"
echo "Mail : $MAIL "

LDAP_UID="$4"
echo "UID : $LDAP_UID "

PASS="$5"
echo "Pass : $PASS"

PASS_W=$(sudo slappasswd -h {SSHA} -s $PASS)

#sleep 1

cat <<EOF > "$LDAP_UID"-add.ldif

dn: uid=$LDAP_UID,ou=users,dc=ldap,dc=algofab,dc=fr
changetype: add
objectClass: inetOrgPerson
description: Algofab user.
cn: $FIRSTNAME $LASTNAME
givenname: $FIRSTNAME
sn: $LASTNAME
mail: $MAIL
uid: $LDAP_UID
userpassword: $PASS_W

EOF


ldapmodify -a -x -D "cn=admin,dc=ldap,dc=algofab,dc=fr" -w pass -H ldap://ws37-cl2-en12 -f "$LDAP_UID"-add.ldif

rm "$LDAP_UID"-add.ldif
