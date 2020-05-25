#!/bin/bash


# npm install

cd /home/admin/algofab/$1
supervisor -w /home/admin/algofab/config,/home/admin/algofab/$1 -- bin/www tl-prod
