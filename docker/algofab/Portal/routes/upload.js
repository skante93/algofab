

var express = require('express'), router = express.Router();

var bCrypt = require('bcrypt-nodejs');
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var restler = require('restler');
var mkdirp = require('mkdirp');

module.exports = function(SG){
	var User = SG.mongo.model('User');
	router.post('/', function(req, res){
		console.log("----------------------------------------------------------");
	    console.log("\t\t UPLOAD : MIDDLEWARE 1");
	    console.log("----------------------------------------------------------");

		new multiparty.Form().parse(req, function(multipart_err, fields, files) {
			console.log('util.inspect(fields) : '+util.inspect(fields));
			console.log('util.inspect(files) : '+util.inspect(files));
			if(multipart_err){
				console.log('multipart_err : ' + multipart_err);
				res.status(500);
				res.end('{"status" : "failure", "message" : "No files to upload"}');
			}
			else{
				
				if( typeof fields['username'] !== 'undefined' && typeof fields['password'] !== 'undefined'){
					User.findOne({username : fields['username'][0]}, function(u_err, data){
						if(u_err || !data || !isValidPassword(data, fields['password'][0])){
							console.log('Error while identifying the user');
							res.send('{"status" : 500, "message" : "Failed to authenticate the user."}');
						}
						else {
							try {
								var userDirRoot = __dirname+'/../public/data/'+fields['username'][0];
								mkdirp.sync(userDirRoot);
								
								var dirSize = getDirSize(userDirRoot);
								if(dirSize == -1){
					        		cleanUpUploads(files);
					        		res.send('{"status" : "failure", "message" : "Failed to Upload."}');
								}
								else if(dirSize > data['storage_limit']){
					        		cleanUpUploads(files);
					        		res.send('{"status" : "failure", "message" : "Storage limit exceeded."}');
					        	}
					        	else {
							        var upload_paths = [];
							    	for(f_path in files){
								    	//var fname = n_dir +((n_dir[n_dir.length-1] == '/')? '': '/')+files.file[0].originalFilename;
								    	//fname = fname.replace(/\/\//g, '/');

								    	console.log('f_path : '+f_path);
								    	
								    	dirSize += files[f_path][0].size;

								    	if(dirSize > data['storage_limit']){
							        		cleanUpUploads(files);
							        		res.send('{"status" : "failure", "message" : "Storage limit exceeded."}');
							        		return;
							        	}
							        	else {
							        		var from = (f_path[0] == '/')? 1 : 0, to = (f_path[f_path.length-1] == '/')? f_path.length-1 : f_path.length;
							        		var url = f_path.substring(from, to);
							        		console.log('url : '+url);

							        		console.log('complete path : '+userDirRoot+'/'+f_path);
							        		if(new RegExp("/").test(url)){
							        			var path =  url.split("/");
							        			path.pop();

							        			if(path.join('')){
							        				path = path.join("/");
							        				console.log("Building path : "+path);
							        				try {
								        				mkdirp.sync(userDirRoot+'/'+path)
								        			}
								        			catch(exception2){
								        				console.log("exception2 : "+util.inspect(exception2));
								        				res.send('{"status" : "failure", "message" : "Failed to Upload."}');
					        							return;
								        			}
							        			}
							        			
							        		}

							        		


							        		var op = moveFileSync(files[f_path][0].path, userDirRoot+'/'+url);

					        				if(op.stderr.toString() != ''){
					        					console.log(op.stderr.toString());
					        					res.send('{"status" : "failure", "message" : "Failed to Upload."}');
					        					return;
					        				}
					        				else{
					        					upload_paths.push(SG.params.PORTAL_EXT_PROTOCOL+SG.params.PORTAL_EXT_ADDR+'/data/'+fields['username'][0]+'/'+url);
					        				}
							        	}
				        			}
			        				res.send('{"status" : "success", "message" : "'+upload_paths.join(', ')+'"}');
			        				//cleanUpUploads(files);
			        			}
							} catch(exception1){
								console.log("exception1 : "+util.inspect(exception1));
								res.send('{"status" : "failure", "message" : "Failed to Upload."}');
							}   
						}
					});
				}
				else {
					console.log('Error : not able to iedntify user');
					res.send('{"status" : "failure", "message" : "Can\'t user\'s username and password"}');
				}
			}
		});
	});
	return router;
}
var isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password);
};

var moveFileSync = function(srcPath, destPath){
	return require('child_process').spawnSync('mv', [srcPath, destPath]);
}

function getDirSize(name){
  var stat = fs.statSync(name);
  if(!stat.isDirectory())
    return -1;
  var size = stat.size;
  var rd = fs.readdirSync(name);
  for(var i=0; i < rd.length; i++ ){
    //console.log(util.inspect(rd[i]));
    if(fs.statSync(name+'/'+rd[i]).isDirectory()){
      var subSize = getDirSize(name+'/'+rd[i]);
      if(subSize == -1) return -1;
      size += subSize;
    }
    else 
      size += fs.statSync(name+'/'+rd[i]).size;
  }
  return size;
}

function cleanUpUploads(files){
	for (var n in files){
		for(var i=0; i<files[n].length; i++)
			require('child_process').spawn('rm', ['-r', files[n][i].path]);
	}
}
