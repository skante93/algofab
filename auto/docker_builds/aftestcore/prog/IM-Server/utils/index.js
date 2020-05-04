
module.exports = function(SG){

	return {
		proxy : require('./proxy'),
		dao : require('./DAO')(SG.mongo),
		//kubeObjectWatcher : require('./kubeObjectWatcher'),
		async : require('./async'),
		kube : require('./kube')(SG),
		//buildKubeObjects : require('./buildKubeObjects')(SG)
	}
}