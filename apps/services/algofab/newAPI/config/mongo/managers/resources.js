
const settings = require('../../settings');
//const fs = require('fs'), bCrypt = require('bcrypt'), utils = require('../../utils'), ldapManager = new utils.Ldap();
const utils = require('../../utils');

const mongoModels = require('../models'), 
	resourcesModel = mongoModels.model('Resources'); //, photoModel = mongoModels.model('Photos');

const UsersManager = require('./users');

class ResourcesManager{
	getOne(params){

		return new Promise((resolve, reject)=>{

			if ( !("rid" in params) ){
				return reject(new Error(`MissingParamError: Parameter "rid" is mandatory.`));
			}

			resourcesModel.findById(params.rid, (err, resource)=>{

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				if (!resource) return reject(new Error(`NotFoundError: no resource found with id : "${params.rid}".`));

				resolve(resource);
			});
		});
	}

	get(params){

		return new Promise((resolve, reject)=>{

			var query = {};

			var fields = "fields" in params && params.fields? params.fields: [], select = {};
			fields.forEach((p) => { select[p] = 1;});

			resourcesModel.find(query, select, (err, resources)=> {

				if (err) return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

				resolve(resources);
			});
		});
	}

	create(params){
		return new Promise((resolve, reject)=>{
			//
			var r_metatada = {};

			//
			if (!('author' in params && params.author)){
				return reject(new Error(`MissingParamError: Parameter "author" is mandatory.`));
			}
			if (false){
				return reject(new Error(`FormatError: Parameter "author" is in wrong format.`));
			}


			//
			if (!('name' in params && params.name)){
				return reject(new Error(`MissingParamError: Parameter "name" is mandatory.`));
			}
			if (false){
				return reject(new Error(`FormatError: Parameter "name" is in wrong format.`));
			}
			r_metatada.name = params.name;
			
			//
			if (!('asset_type' in params && params.asset_type)){
				return reject(new Error(`MissingParamError: Parameter "asset_type" is mandatory.`));
			}
			if (false){
				return reject(new Error(`FormatError: Parameter "asset_type" is in wrong format.`));
			}
			r_metatada.asset_type = params.asset_type;
			
			//
			if ('version' in params && params.version){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "version" is in wrong format.`));
				}
				r_metatada.version = params.version;
			}
			
			//
			if ('short_intro' in params && params.short_intro){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "short_intro" is in wrong format.`));
				}
				r_metatada.short_intro = params.short_intro;
			}

			//
			if ('description' in params && params.description){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "description" is in wrong format.`))
				}
				r_metatada.description = params.description;
			}

			//
			if ( ('docs_type' in params && params.docs_type) && ('docs_details' in params && params.docs_details)){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "docs_type" is in wrong format.`))
				}
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "docs_details" is in wrong format.`))
				}
				if (params.docs_type == "file"){
					try{
						if (!("path" in params.docs_details)){
							return reject(new Error(`WrongValueError: parameter "docs_details" is expected to be a file when parameter "docs_type" equals to "file".`));
						}
					}
					catch(e){
						return reject(new Error(`WrongValueError: parameter "docs_details" is expected to be a file when parameter "docs_type" equals to "file".`));
					}
				}

				r_metatada.documentations = {
					media_type: params.docs_type,
					details: params.docs_type == "file"? {content_type: params.docs_details.headers['content-type'], buffer: fs.readFileSync(params.docs_details.path)} :params.docs_details
				}
				if (params.docs_type == "file") fs.unlinkSync(params.docs_details.path);
			}
			
			//
			if ('logoFile' in params && params.logoFile){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "logoFile" is in wrong format.`))
				}
				r_metatada.logo = { content_type: params.logoFile.headers['content-type'], buffer: fs.readFileSync(params.logoFile.path)};
				fs.unlinkSync(params.logoFile.path);
			}

			//
			if ('tags' in params && params.tags){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "tags" is in wrong format.`))
				}
				r_metatada.tags = params.tags;
			}

			//
			if ('private' in params && params.private){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "private" is in wrong format.`))
				}
				r_metatada.private = params.private;
			}

			//
			if ('licence' in params && params.licence){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "licence" is in wrong format.`))
				}
				r_metatada.licence = params.licence;
			}

			//
			if ('agreement' in params && params.agreement){
				if (false){ // Conditions yet to be defined
					return reject(new Error(`FormatError: Parameter "agreement" is in wrong format.`))
				}
				r_metatada.agreement = params.agreement;
			}
			
			new UsersManager().getOne({uid:params.author}).then(author=>{
				new resourcesModel({metadata: r_metatada, author: params.author}).save((err, resource)=>{
					if (err) reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve(resource);
				});
			}).catch(reject);
			
		});
	}

	updateMetadata(params){
		return new Promise((resolve, reject)=>{
			if (!('rid' in params)){
				return reject(new Error(`Resource ID is mandatory`));
			}

			var r_metatada = {};

			this.getOne({rid: params.rid}).then(resource=>{
				if ('name' in params && params.name && resource.metadata.name != params.name){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "name" is in wrong format.`));
					}
					r_metatada.name = params.name;
				}
				
				
				//
				if ('asset_type' in params && params.asset_type && resource.metadata.asset_type != params.asset_type){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "asset_type" is in wrong format.`));
					}
					r_metatada.asset_type = params.asset_type;
				}
				
				
				//
				if ('version' in params && params.version && resource.metadata.version != params.version){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "version" is in wrong format.`));
					}
					r_metatada.version = params.version;
				}
				
				//
				if ('short_intro' in params && params.short_intro && resource.metadata.short_intro != params.short_intro){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "short_intro" is in wrong format.`));
					}
					r_metatada.short_intro = params.short_intro;
				}

				//
				if ('description' in params && params.description && resource.metadata.description != params.description){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "description" is in wrong format.`))
					}
					r_metatada.description = params.description;
				}

				//
				if ( ('docs_type' in params && params.docs_type) && ('docs_details' in params && params.docs_details)){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "docs_type" is in wrong format.`))
					}
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "docs_details" is in wrong format.`))
					}
					if (params.docs_type == "file"){
						try{
							if (!("path" in params.docs_details)){
								return reject(new Error(`WrongValueError: parameter "docs_details" is expected to be a file when parameter "docs_type" equals to "file".`));
							}
						}
						catch(e){
							return reject(new Error(`WrongValueError: parameter "docs_details" is expected to be a file when parameter "docs_type" equals to "file".`));
						}
					}
					r_metatada.documentations = {
						media_type: params.docs_type,
						details: params.docs_type == "file"? {content_type: params.docs_details.headers['content-type'], buffer: fs.readFileSync(params.docs_details.path)} :params.docs_details
					}
					if (params.docs_type == "file") fs.unlinkSync(params.docs_details.path);
				}
				
				//
				if ('logoFile' in params && params.logoFile){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "logoFile" is in wrong format.`))
					}
					r_metatada.logo = { content_type: params.logoFile.headers['content-type'], buffer: fs.readFileSync(params.logoFile.path)};
					fs.unlinkSync(params.logoFile.path);
				}

				//
				if ('tags' in params && params.tags){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "tags" is in wrong format.`))
					}
					var newTags = params.tags.length != resource.metadata.tags.length || params.tags.map((t,i)=> t != resource.metadata.tags[i]).reduce((a,b)=>a||b);
					if (newTags){ 
						r_metatada.tags = params.tags;
					}
				}

				//
				if ('private' in params && params.private && resource.metadata.private != params.private){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "private" is in wrong format.`))
					}
					r_metatada.private = params.private;
				}

				//
				if ('licence' in params && params.licence && resource.metadata.licence != params.licence){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "licence" is in wrong format.`))
					}
					r_metatada.licence = params.licence;
				}

				//
				if ('agreement' in params && params.agreement && resource.metadata.agreement != params.agreement){
					if (false){ // Conditions yet to be defined
						return reject(new Error(`FormatError: Parameter "agreement" is in wrong format.`))
					}
					r_metatada.agreement = params.agreement;
				}
				
				
				// Let us proceed to the update

				if (Object.keys(r_metatada).length == 0) return resolve(resource); // Nothing to update

				for (var k in r_metatada) resource.metadata[k] = r_metatada[k];

				resource.save((err, r)=>{
					if (err) reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve(r);
				});
			}).catch(reject);
		});
	}

	addTag(params){
		return new Promise((resolve, reject)=>{
			if (!('rid' in params)){
				return reject(new Error(`Resource ID is mandatory`));
			}

			this.getOne({rid: params.rid}).then(resource=>{
				params.tags.forEach((tag, index)=>{
					if (tag.name && tag.value){
						if (resource.metadata.tags.filter(rt=> rt.name == tag.name && rt.value == tag.value).length == 0){
							//console.log("adding tag: ", tag);
							resource.metadata.tags.push(tag);
						}
					}
				});

				resource.save((err, r)=>{
					if (err) reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve(r);
				});
			}).catch(reject);
		});
	}

	removeTag(params){
		return new Promise((resolve, reject)=>{
			if (!('rid' in params)){
				return reject(new Error(`Resource ID is mandatory`));
			}
			if (!('id' in params)){
				return reject(new Error(`Tag ID is mandatory`));
			}

			this.getOne({rid: params.rid}).then(resource=>{
				if(resource.metadata.tags.filter(t=> t._id.toString() == params.id).length == 0){
					return reject(new Error(`NotFoundError: no tage with ID "${params.id}" found.`))
				}

				for (var i=0; i<resource.metadata.tags.length; i++){
					if (resource.metadata.tags[i]._id.toString() == params.id){
						resource.metadata.tags.splice(i,1);
						break;
					}
				}

				resource.save((err, r)=>{
					if (err) reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve(r);
				});
			}).catch(reject);
		});
	}
	
	remove(params){
		//
		return new Promise ((resolve, reject)=>{
			//
			if ( !('rid' in params) ){
				return reject(new Error(`Resource ID is mandatory`));
			}
			if ( !('noDelay' in params) ){
				params.noDelay = false;
			}

			if (params.noDelay){
				resourcesModel.remove({_id: params.rid}, (err)=>{
					if (err) 
						return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );

					resolve();
				});
			}
			else{
				resourcesModel.updateOne({_id: params.rid}, {$set: {deleteAt : Date.now()+settings.app_settings.resource_removal_delay}}, (err)=>{
					if (err) 
						return reject (new Error(`DBError: ${err.toString().replace(/^Error\:\ /, '')}`) );
					resolve();
				});
			}
		});
	}
}

module.exports = ResourcesManager;