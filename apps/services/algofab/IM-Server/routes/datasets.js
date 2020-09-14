

var router = require('express').Router();

var pvTemplate = function(name, size){
    return {
        "apiVersion": "v1",
        "kind": "PersistentVolume",
        "metadata":{
            "name": name
        },
        "spec": {
            "capacity": {
                "storage": size+"Gi"
            },
            "accessModes": [ "ReadWriteMany" ] ,
            "volumeMode": "Filesystem",
            "persistentVolumeReclaimPolicy": "Recycle",
            "storageClassName": "nfs-sc",
            "nfs": {
                "path": "/home/skante/kube_algofab/data/datasets/"+name,
                "server": "10.200.209.30"
            }
        }
    }
}

var pvcTemplate = function(name, pvName, ns , size){

    return {
        kind: "PersistentVolumeClaim",
        apiVersion: "v1",
        metadata: {
            name: name,
            namespace: ns,
            annotations: {
                "volume.beta.kubernetes.io/storage-class": "nfs-sc"
            }
        },
        spec:{
            accessModes: [ "ReadWriteMany"],
            resources:{
                requests: {
                    storage: size+"Gi"
                }
            },
            storageClassName: "nfs-sc",
            volumeName: pvName
        }
    }
}
router.post('/', function(req,res){
    if (!req.body.name){
        return res.status(400).json({status: "failure", message: 'parameter "name" is required'});
    }
    if (!req.body.ns){
        return res.status(400).json({status: "failure", message: 'parameter "ns" is required'});
    }

    var size = typeof req.body.size !== 'undefined' ? req.body.size: null;
    if (size != null){
        if (isNaN(parseInt(size))){
            return res.status(400).json({status: "failure", message: 'parameter "size" is has to be an integer'});
        }
    } 
    else{
        size = 2;
    }

    utils.kubectl(req.body.ns).create(pvTemplate(req.body.name, size)).catch( (err)=>{
		console.log("Error : "+err);
		res.status(500).end(JSON.stringify({status : "failure", message : "Error while creating PV"}))	;
	}).then( ()=>{
        utils.kubectl(req.body.ns).create(pvcTemplate(req.body.name, req.body.name, req.body.ns, size)).catch( (err)=>{
            console.log("Error : "+err);
            res.status(500).end(JSON.stringify({status : "failure", message : "Error while creatin PVC"}))	;
        }).then( ()=>{
            res.end(JSON.stringify({status : "success", message : "done"}))	;
        });
	});
});

module.exports = router;