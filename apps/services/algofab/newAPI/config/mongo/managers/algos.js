
const settings = require('../../settings');

const mongoModels = require('../models'), 
    algoTemplatesModel = mongoModels.model('AlgoTemplates'), 
    algoInstancesModel = mongoModels.model('AlgoInstances'),
    usersModel = mongoModels.model('Users'),
    liveDataModel = mongoModels.model('LiveData');

const utils = require('../../utils'), infraManager = new utils.InfraManager();

class AlgosManager {
    uniqueLDPathSegmentName (name){
		//if ()
		var n = name.toLowerCase().replace(/((\ +)|\.+)/g, '_');
		return n;
    }
    
    getOne(kind, params){

		return new Promise((resolve, reject)=>{

			if ( !("id" in params) ){
				return reject(new Error(`MissingParamError: Parameter "id" is mandatory.`));
			}
            var model = kind == "template"? algoTemplatesModel : algoInstancesModel;

			model.findById(params.id, (err, a)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!a) return reject(new Error(`NotFoundError: no algorihtm ${kind} with id : "${params.id}" found.`));

				resolve(a);
			});
		});
	}

    get(kind, params){
        return new Promise((resolve, reject)=>{

			var query = {};

			var fields = "fields" in params && params.fields? params.fields: [], select = {}, model = kind == "template"? algoTemplatesModel : algoInstancesModel;
			fields.forEach((p) => { select[p] = 1;});

			model.find(query, select, (err, algo)=> {

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				resolve(algo);
			});
		});
    }

    getTemplateInstances(params) {
        return new Promise((resolve, reject)=>{
            if ( !("templateID" in params)){
                return reject(new Error(`MissingParamError: Field "templateID" is mandatory`));
            }
            var fields = "fields" in params && params.fields? params.fields: [], select = {};
            fields.forEach((p) => { select[p] = 1;});

            algoInstancesModel.find({templateID: params.templateID}, select,  (err, ais)=>{
                if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

                resolve(ais);
            })
        });
    }
    getInstancesMountingLiveData (ldid) {
        return new Promise((resolve, reject)=>{
            algoInstancesModel.find({ "liveDataMountPoints.liveDataID" : ldid }, (err, ai)=>{
                if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
                resolve(ai);
            });
        });
    }
    createTemplate(params, author) {
        
        return new Promise((resolve, reject)=>{
            if ( !("name" in params)){
                return reject(new Error(`MissingParamError: Field "name" is mandatory`));
            }
            if(!settings.app_settings.algo_name_regex.test(params.name)){
                return reject (new Error(`FormatError: Parameter "name" is not confrm to the specified format, make sure it matches the regex : ${settings.app_settings.algo_name_regex.toString()}.`));
            }
            if ("settings" in params){
                // TODO test params conformity
                if (params.settings.length == 0) {
                    delete params.settings;
                }
            }
            if (!("container" in params)){
                return reject(new Error(`MissingParamError: Field "container" is mandatory`));
            }
            else{
                
                if (!("image" in params.container)){
                    return reject(new Error(`MissingParamError: Field "container.image" is mandatory`));
                }
                if ("ports" in params.container){
                    // TODO test container ports conformity
                }
            }
            if ("inputs" in params){
                // TODO test inputs conformity
            }
            if ("output" in params){
                // TODO test output conformity
            }
            if ("liveDataMountPoints" in params){
                // TODO test liveDataMountPoints conformity
                if (params.liveDataMountPoints.length == 0) {
                    delete params.liveDataMountPoints;
                }
            }
            
            params.author = author;

            new algoTemplatesModel(params).save((err, templ)=>{
                if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

                resolve(templ);
            });
        });
    }

    createInstance(params, author) {
        return new Promise((resolve, reject)=>{

            if ( !("name" in params)){
                return reject(new Error(`MissingParamError: Field "name" is mandatory`));
            }
            if(!settings.app_settings.algo_name_regex.test(params.name)){
                return reject (new Error(`FormatError: Parameter "name" is not confrm to the specified format, make sure it matches the regex : ${settings.app_settings.algo_name_regex.toString()}.`));
            }

            if ( !("templateID" in params)){
                return reject(new Error(`MissingParamError: Field "templateID" is mandatory`));
            }

            if ("settings" in params){
                // TODO test params conformity
                if (params.settings.length == 0) {
                    delete params.settings;
                }
            }
            if ("inputs" in params){
                // TODO test inputs conformity
            }
            if ("output" in params){
                // TODO test output conformity
            }
            if ("liveDataMountPoints" in params){
                // TODO test liveDataMountPoints conformity
                if (params.liveDataMountPoints.length == 0) {
                    delete params.liveDataMountPoints;
                }
            }
            
            // CHECKS
            // 1- check template referenced was right, if so, retrieve it
            new Promise((resolve_c, reject_c)=>{
                algoTemplatesModel.findById(params.templateID, (err, templ)=>{
                    if (err) return reject_c (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

                    if (!templ)return reject_c (new Error(`Algo template with ID ${params.templateID} does not exist.`));

                    resolve_c(templ);
                });
            })
            // 2- check settings AND liveDataMountPoints provided
            .then((templ)=>{
                return new Promise ((resolve_c, reject_c)=>{
                    // Were all the specified settings provided?
                    //   if template has settings...
                    if (templ.settings != undefined && templ.settings != null){

                        params.settings = !params.settings? params.settings : params.settings.filter(s => templ.settings.map(t=>t.name).indexOf(s.name)>=0 );
                        
                        // ... while params has not
                        var required_settings = templ.settings.filter(e=> e.required === true);
                        for (var i=0; i<required_settings.length; i++){
                            if (params.settings.filter(e=> e.name == required_settings[i].name).length == 0){
                                return reject_c(new Error(`required settings "${required_settings[i].name}" not specified.`));
                            }
                        }

                        var optional_settings = templ.settings.filter(e=> e.required === false);
                        for (var i=0; i<optional_settings.length; i++){

                            // not specfied but has default value
                            if (params.settings.filter(e=> e.name == optional_settings[i].name).length == 0 && "default" in optional_settings[i]){ 
                                params.settings.push({ name: optional_settings[i].name, value: optional_settings[i].default });
                            }
                        }
                    }

                    // Were all the specified liveDataMountPoints provided?
                    //   if template has settings...
                    if (templ.liveDataMountPoints != undefined && templ.liveDataMountPoints != null){
                        params.liveDataMountPoints = !params.liveDataMountPoints? params.liveDataMountPoints : params.liveDataMountPoints.filter(s => templ.liveDataMountPoints.map(t=>t.name).indexOf(s.name)>=0 );
                        
                        // ... while params has not
                        for (var i=0; i<templ.liveDataMountPoints.length; i++){
                            if (params.liveDataMountPoints.filter(e=> e.name == templ.liveDataMountPoints[i].name).length == 0){
                                return reject_c(new Error(`liveDataMountPoint "${templ.liveDataMountPoints[i].name}" not specified.`));
                            }
                        }
                    }

                    resolve_c(templ);
                });
            })
            // 3- check the liveData requested exists and user can request for it
            .then((templ)=>{
                return new Promise((resolve_c, reject_c)=>{
                    if (params.liveDataMountPoints == undefined || params.liveDataMountPoints == null) return resolve_c(templ);
                    var validate_next = (index)=>{

                        if (typeof index === 'undefined') index = 0;
                        //console.log("index : ", index);

                        if (index == params.liveDataMountPoints.length) {
                            return resolve_c(templ);
                        }

                        var ldid = params.liveDataMountPoints[index].liveDataID;
                        liveDataModel.findById(ldid, (err, ld)=>{
                            if (err) {
                                return reject_c (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
                            }

                            if (!ld) {
                                return reject_c (new Error(`NotFoundError: liveDataMountPoints[${index}].liveDataID : no LiveData with ID ${ldid} found.`) );
                            }
                            
                            // The user performing this operation is not the author of the LD
                            if (author._id.toString() != ld.author) {
                                return reject_c(new Error(`NotAuthorizedError: you (${author.profile.username}) do not own the LiveData "${ldid}", your request is rejected.`))
                            }
                            
                            params.liveDataMountPoints[index].liveData = ld;
                            params.liveDataMountPoints[index].mountPoint = templ.liveDataMountPoints.filter(e=> e.name == params.liveDataMountPoints[index].name)[0].mountPoint; 
                            
                            validate_next(index+1);
                        });
                    }
                    validate_next();
                });
            })
            // 4- build the infrastructure
            .then((templ)=>{
                params.apiVersion = "v1";
                params.type = "toto";
                templ.container.image = templ.container.image.toLowerCase();
                params.spec = { 
                    name: this.uniqueLDPathSegmentName(params.name), 
                    settings: params.settings,
                    container: templ.container,
                    liveDataMountPoints: params.liveDataMountPoints
                };

                infraManager.buildAlgoInstance(params, author).then(result=>{
                    console.log("results: ", result);

                    params.author = author._id.toString();
                    params.spec = { deployed: result.deployed, info: { name: result.response.Name, id: result.response.Id } };
                    //console.log("Reahced here!!! #4");	
                    
                    new algoInstancesModel(params).save((err, ai)=>{
                        if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

                        resolve(ai);
                    });
                    
                    /*
                    new algoInstanceModel(params).save((err, templ)=>{
                        if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
        
                        resolve(templ);
                    });
                    */
                })
                .catch(e => reject(e));
            })
            .catch(e=>{
                reject(e);
            });

        });
    }

    removeInstance(params, author) {
        return new Promise((resolve, reject)=>{

			if ( !("instanceID" in params && params.instanceID) ){
				return reject(new Error(`MissingParamError: Parameter "instanceID" is mandatory.`));
			}

			// TODO check byUser user has the right to remove the live-data

			

			algoInstancesModel.findById(params.instanceID, (err, ai)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!ai) return reject(new Error(`NotFoundError: no algo instance with ID "${params.instanceID}" found.`));

				// TODO remove ALL other resources depending on this liveData 
                infraManager.removeStack(ai.spec.info.id).then(result=>{
                    ai.remove((err)=>{

                        if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
    
                        resolve();
                    });
                })
                .catch(e => {
                    console.log("e.toString() == 'Unable to find a stack with the specified identifier inside the database'", (e.toString() == 'Unable to find a stack with the specified identifier inside the database'));
                    if (e.toString() != 'Unable to find a stack with the specified identifier inside the database'){ 
                        return reject(e); 
                    }
                    ai.remove((err)=>{

                        if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
    
                        resolve();
                    });        
                });
                
			});
		});
    }

    removeTemplate(params, author) {
        return new Promise((resolve, reject)=>{

			if ( !("templateID" in params && params.templateID) ){
				return reject(new Error(`MissingParamError: Parameter "templateID" is mandatory.`));
			}

			// TODO check byUser user has the right to remove the live-data

			

			algoTemplatesModel.findById(params.templateID, (err, at)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!at) return reject(new Error(`NotFoundError: no algo instance with ID "${params.templateID}" found.`));


                this.getTemplateInstances(params).then((ais)=>{

                    var remove_next = (index, callback)=>{
                        if (typeof index === 'function' && typeof callback === 'undefined') {
                            callback = index; index = 0;
                        }

                        if (index == ais.length) return callback(null);

                        this.removeInstance({
                            instanceID: ais[index]._id.toString()
                        })
                        .then(()=>{ remove_next (index+1, callback ); })
                        .catch(e=> { callback(e); })
                    }

                    remove_next((err)=>{
                        if (err) { return reject(err); }

                        at.remove((err)=>{

                            if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
        
                            resolve();
                        });
                    });
                });
			});
		});
    }
}

module.exports = AlgosManager;