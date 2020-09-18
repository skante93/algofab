
const settings = require('../../settings');
//const fs = require('fs'), bCrypt = require('bcrypt'), utils = require('../../utils'), ldapManager = new utils.Ldap();
const utils = require('../../utils'), infraManager = new utils.InfraManager();

const mongoModels = require('../models'), 
	liveDataModel = mongoModels.model('LiveData');


const UsersManager = require('./users'), AlgosManager = require('./algos'), algosManager = new AlgosManager();


class LiveDataManager{
	uniqueLDPathSegmentName (name){
		//if ()
		var n = name.toLowerCase().replace(/((\ +)|\.+)/g, '_');
		return n;
	}

	getOne(params){

		return new Promise((resolve, reject)=>{

			if ( !("ldid" in params) ){
				return reject(new Error(`MissingParamError: Parameter "ldid" is mandatory.`));
			}

			liveDataModel.findById(params.ldid, (err, ld)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!ld) return reject(new Error(`NotFoundError: no resource found with id : "${params.ldid}".`));

				resolve(ld);
			});
		});
	}

	get(params){

		return new Promise((resolve, reject)=>{

			var query = {};

			var fields = "fields" in params && params.fields? params.fields: [], select = {};
			fields.forEach((p) => { select[p] = 1;});

			liveDataModel.find(query, select, (err, lds)=> {

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				resolve(lds);
			});
		});
	}

	create(params){
		return new Promise( (resolve, reject)=>{

			if ( !("apiVersion" in params && params.apiVersion)){
				return reject (new Error(`MissingParamError: Parameter "apiVersion" is required.`));
			}
			if ( !("name" in params && params.name)){
				return reject (new Error(`MissingParamError: Parameter "name" is required.`));
			}
			if ( !settings.app_settings.livedata_name_regex.test(params.name)){
				return reject (new Error(`FormatError: Parameter "name" is not confrm to the specified format, make sure it matches the regex : ${settings.app_settings.livedata_name_regex.toString()}.`));
			}
			// if ( !("spec" in params && params.spec)){
			// 	return reject (new Error(`MissingParamError: Parameter "spec" is required.`));
			// }
			if ( !("sshKeys" in params && params.sshKeys)){
				return reject (new Error(`MissingParamError: Parameter "sshKeys" is required.`));
			}
			if ( params.sshKeys.length == 0){
				return reject (new Error(`MissingParamError: Parameter "sshKeys" cannot be an empty array.`));
			}
			
			//console.log("Reahced here!!! #1");
			liveDataModel.find({ author: params.author._id.toString()}, (err, lds)=> {

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				//console.log("Reahced here!!! #2");
				var thisUniquePSN = this.uniqueLDPathSegmentName(params.name);
				for (var i=0; i<lds.length; i++){
					if ( this.uniqueLDPathSegmentName(lds[i].name) == thisUniquePSN){
						return reject(new Error(`ValueError: Parameter "name" is too close to that of another of your resource (named: ${lds[i].name}), please choose another name`));
					}
				}

				
				//console.log("Reahced here!!! #3");
				params.spec = {name : thisUniquePSN, sshKeys : params.sshKeys};

				infraManager.buildLiveData(params, params.author).then(result=>{
					//console.log("result : ", result);
					params.author = params.author._id.toString();
					params.spec = { deployed: result.deployed, info: { name: result.response.Name, id: result.response.Id } };
					//console.log("Reahced here!!! #4");	
					
					new liveDataModel(params).save((err, ld)=>{
						if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

						resolve(ld);
					});
				})
				.catch(e =>{ reject(e); });
			});
		});
	}

	remove(params, author){
		return new Promise((resolve, reject)=>{

			if ( !("ldid" in params && params.ldid) ){
				return reject(new Error(`MissingParamError: Parameter "ldid" is mandatory.`));
			}

			// TODO check byUser user has the right to remove the live-data

			

			liveDataModel.findById(params.ldid, (err, ld)=>{
				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!ld) return reject(new Error(`NotFoundError: no live data with ID "${params.ldid}" found.`));
				
				var remove_this_live_data_and_quit = (err)=>{
					if (err) { return reject(err); }

					infraManager.removeStack(ld.spec.info.id).then(result =>{
						ld.remove((err)=>{

							if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

							resolve();
						});
					}).catch(e => reject(e));
				}

				algosManager.getInstancesMountingLiveData(ld._id.toString()).then((ais)=>{
					if (ais.length != 0){
						if ( !(params.force === true) ){
							return reject (new Error('It is not safe to remove this liveData that is being used elsewhere. If you still wish to remove it, use the force option (this will delete all the algo instances using this liveData).'));
						}
					}

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

                    remove_next(remove_this_live_data_and_quit);
					
				}).catch(e=> reject(e) );
			});
		});
	}
}

module.exports = LiveDataManager;