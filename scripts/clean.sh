DEFAULT_ORDER="kube-dns.yaml core.yaml services.yaml configmaps.yaml volumes.yaml pods.yaml"


for f in $DEFAULT_ORDER
do
	echo -e "\n\n- Deleting : $f\n"
	kubectl delete -f specs/$f
done