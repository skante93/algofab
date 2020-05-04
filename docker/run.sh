#!/bin/bash

#SERVER="$1"

cd /home/admin/algofab/$1
supervisor -w /home/admin/algofab/config,/home/admin/algofab/$1 -- bin/www tl-prod
