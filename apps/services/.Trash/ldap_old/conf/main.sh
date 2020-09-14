#!/bin/bash
#set -e

. ./env.sh

. ./install_ldap.sh

. ./configure_ldap.sh

. ./install_and_configure_phpldapadmin.sh

