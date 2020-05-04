
var mkdirp = require('mkdirp');
var spawnSync = require('child_process').spawnSync;
var fs = require('fs'), util = require('util');

const version_mask = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const unscript_mask = /<(( )*|(\t)*)*script(.)*<(( )*|(\t)*)*\/(( )*|(\t)*)*script(( )*|(\t)*)*>/;

var User = global.mongo.model("User");
var Algos = global.mongo.model("Algos");
var AlgosMeta = global.mongo.model("AlgosMeta");
var User = global.mongo.model("User");

var getById = function(id, cb ){ 
	AlgosMeta.findById(id).exec( function(err, result){ 
		cb(err, result); 
	}); 
}

var getByName = function(name, cb ){ 
	AlgosMeta.findOne({ title : name }).exec( function(err, result){ 
		cb(err, result); 
	}); 
}

var getFieldsByID = function(id, array, cb){
	if (array instanceof Array)
		array = array.join(' ');
	AlgosMeta.findOne({ _id : id }, array).exec(function(err, result){ 
		cb(err, result); 
	});
}

var getFieldsByName = function(name, array, cb){
	if (array instanceof Array)
		array = array.join(' ');
	AlgosMeta.findOne({ title : name }, array).exec(function(err, result){ 
		cb(err, result); 
	});
}

var setFieldsByID = function(id, fields, cb){
	
	AlgosMeta.findOneAndUpdate({ _id : id }, { $set : fields }, { new : true }).exec(function(err, result){ 
		cb(err, result); 
	});
}

var setFieldsByName = function(name, fields, cb){
	
	AlgosMeta.findOneAndUpdate({ title : name }, { $set : fields }, { new : true }).exec(function(err, result){ 
		cb(err, result); 
	});
}

var setLogo = function(id, newLogoPath, cb){
	if (!fs.existsSync(newLogoPath)) {
		return cb(newLogoPath+" doesn't exist");
	}

	AlgosMeta.findOne({ _id : id }).exec(function(err, result){
		if(err || !result){
			return cb("A Database error occured or the algorithm does not exist");
		}

		var defaultLogoPath = process.cwd()+'/public/img/logo/'+algo.title;
		var mv = spawnSync('mv', [newLogoPath, defaultLogoPath]); error = mv.stderr.toString();
		if (error){
			console.log('RM error : '+err);
			return cb("Internal server error");
		}

		if(!result.logo){
			result.logo = defaultLogoPath.replace(process.cwd()+'/public', '');
			algo.save(function(save_error){
				if(save_error){
					console.log('DB error : '+err);
					return cb('DB error');
				}
				cb(null);
			});
			return;
		}
		cb(null);
}




//var removeVersion = function(){}

var getAuthorByID = function(id, cb){
	AlgosMeta.findById(id).populate("author").exec(function(err, result){
		//
		if (err) return cb(err);

		cb(null, result.author);
	});
}

var getAuthorByName = function(name, cb){
	AlgosMeta.findOne({ title : name }).populate("author").exec(function(err, result){
		//
		if (err) return cb(err);

		cb(null, result.author);
	});
}

var versionExistsByID = function(id, version_number, cb){
	AlgosMeta.findById(id).populate("author versions").exec(function(err, result){
		//
		if (err || !result) return cb(err || "There is no algorithm by the specified ID");

		for(var i=0; i < result.versions.length; i++)
			if(result.versions[i].version == version_number)
				return cb(null, true);

		cb(null, false);
	});
}

var versionExistsByName = function(id, version_number, cb){
	AlgosMeta.findOne({ title : name }).populate("author versions").exec(function(err, result){
		//
		if (err || !result) return cb(err || "There is no algorithm by the specified ID");

		for(var i=0; i < result.versions.length; i++)
			if(result.versions[i].version == version_number)
				return cb(null, true);

		cb(null, false);
	});
}

var validator = {
	title : function(title, cb) {
		if (!title){
			return cb("The title is required.");
		}
		if( !(title.length >= 3) ){
			return cb("The title should have at least 3 characters.");
		}

		AlgosMeta.findOne({ title : title }).populate('author').exec(function( err, result ) {
			if(err){
				console.log("DB error : "+err);
				return cb("DB error");
			}
			if (result){
				console.log("algo already exist.");
				return cb("algo already exist.");
			}
			cb(null);
		});
	},

	logo : function(file, title, cb) {
		if(!file)
			return cb(null)

		var dst = process.cwd()+"/public/img/logo/";

		mkdirp(dst, function(err){
			if(err){
				return cb("Internal server error");
			}
			dst += title;
			var mv = spawnSync('mv', [file.path, dst]), error = mv.stderr.toString();
			if(error){
				return cb("Internal server error");
			}
			cb(null, dst.replace(process.cwd()+"/public", ""));
		});
	},

	description : function(description, cb){
		try{
			description = (description instanceof Array)? description.join('') : (typeof description === 'string')? description : undefined;
		}
		catch (e){
			return cb("Internal error.");
		}

		if (!description){
			return cb("The description is required.");
		}


		if( unscript_mask.test(description) ){
			return cb("description is not supposed to contain any script tag.");
		}

		cb(null); 
	},

	upload : function(fields, logo, cb){
		console.log("fields : "+util.inspect(fields));
		console.log("files : "+util.inspect(logo));
		
		var title = fields.title[0];
		var description = fields.description[0];
		
		validator.title(title, function(errTitle){
			if(errTitle)
				return cb(errTitle);

			console.log("\t -- validateTitle ok");
			validator.description(description, function(errDescription){
				if(errDescription)
					return cb(errDescription);
				
				console.log("\t -- validateDescription ok");
				validator.logo( logo , title, function(errLogo, logoPath){
					if(errDescription)
						return cb(errDescription);
					
					console.log("\t -- validateLogo ok, logoPath "+logoPath);
					cb(null, logoPath);
				});
			});
		});
	}
}


module.exports = {
	getById : getById,
	getByName : getByName,
	getFieldsByID : getFieldsByID,
	getFieldsByName : getFieldsByName,
	setFieldsByID : setFieldsByID,
	setFieldsByName : setFieldsByName,
	setLogo : setLogo,
	getAuthorByID : getAuthorByID,
	getAuthorByName : getAuthorByName,
	versionExistsByID : versionExistsByID,
	versionExistsByName : versionExistsByName,
	validator : validator
}