

#
# ./launch.sh IM-Server "" 1 
#

#
# ./launch.sh Portal "im" 
#

#
# ./launch.sh RH-Server "" 
#


SRV="$1"
LINKS=""
DAEM=0

CMD="docker run --rm -it --link mongo -v $(pwd)/algofab:/home/admin/algofab --name"

[[ "$SRV" == "Portal" ]] && CMD="$CMD portal" || CMD="$CMD `echo $SRV | cut -d "-" -f 1 | tr '[:upper:]' '[:lower:]'`"


if [ $# -ge 2 ]; then
	LINKS=`echo $2 | sed s/,/\ /g` 
fi

#echo "LINKS: $LINKS"

if [ $# -ge 3 ]; then
	DAEM=$(($3))
fi

#echo "DAEM: $DAEM"

for l in $LINKS
do
	CMD="$CMD --link $l"
done

if [ $DAEM -eq 1 ]; then
	CMD="$CMD -d algofab $SRV"
	echo $CMD
else 
	CMD="$CMD algofab $SRV" 
fi

echo -e "\n\t\"CMD: $CMD\"\n\n"

$CMD


