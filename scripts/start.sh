
DEFAULT_ORDER="nginx-ingress-controller.yaml kube-dns.yaml core.yaml services.yaml configmaps.yaml volumes.yaml pods.yaml"


for f in $DEFAULT_ORDER
do
	echo -e "\n\n- Creating : $f\n"
	kubectl apply -f n_specs/$f
done
# kubectl create -f 

watch kubectl get all -n algofab
