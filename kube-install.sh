#!/bin/bash

set -e

NODES=("ws67-int-en1 ws67-int-en2")
KUBE_VERSION="1.14.3"


for n in ${NODES[*]}
do
	if [ `hostname` == "$n" ]; then
		echo "######## Installing Kubernetes on $n ########"
		sudo apt-get update && sudo apt-get install -y docker.io sudo apt-transport-https curl
		curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
		sudo sh -c 'echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list'

		sudo apt-get update

		#apt policy kubelet
		sudo apt-get install -y kubelet="$KUBE_VERSION-00" kubeadm="$KUBE_VERSION-00" kubectl="$KUBE_VERSION-00"
	else
		echo "######## Installing Kubernetes on $n ########"
		ssh $n sudo apt-get update && sudo apt-get install -y docker.io sudo apt-transport-https curl
		ssh $n 'curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -'
		ssh $n 'echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list'

		ssh $n sudo apt-get update

		cmd="ssh $n sudo apt-get install -y kubelet=$KUBE_VERSION-00 kubeadm=$KUBE_VERSION-00 kubectl=$KUBE_VERSION-00"
		$cmd
	fi
done
