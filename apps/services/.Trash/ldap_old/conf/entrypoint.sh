
sudo service slapd start

echo "PASSWORD = $LDAP_PASSWORD"

HASHED_PASSWORD=`slappasswd -s $LDAP_PASSWORD`

cat <<EOF > init.ldif
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


sudo ldapmodify -Y EXTERNAL -H ldapi:/// -f init.ldif

source /etc/apache2/envvars

sudo service apache2 restart

if [ ! -d /data ]; then
	sudo mkdir /data
	sudo chown adm:adm /data
fi

if [ -f /data/dump.ldif ]; then
	echo "## Recovering DATA : ldapmodify -a -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif ##"
	sudo ldapmodify -a -x -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -f /data/dump.ldif
fi

while [ true ];do
	echo "## Backing up : ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b ou=users,$LDAP_BASE_DN > /data/dump.ldif " 
	ldapsearch -xLLL -D cn=admin,$LDAP_BASE_DN -w $LDAP_PASSWORD -H ldap:/// -b $LDAP_BASE_DN > /data/dump.ldif 
	sleep $(($LDAP_BACKUP_FREQ))  # 5minutes
done
