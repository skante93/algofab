

const settings = require('./settings'), db = require('./mongo');

const userModel = db.mongo.model('Users'), resourcesModel = db.mongo.model('Resources');

const userMan = new db.UsersManager(), resourceMan = new db.ResourcesManager();

function print_out (){
	console.log("+-+-+-+-+- DAEMON INFO -+-+-+-+-+ [[")
	console.log.apply(null, arguments);
	console.log("]] +-+-+-+-+- DAEMON INFO -+-+-+-+-+")
}
function print_err (){
	console.error("+-+-+-+-+- DAEMON ERROR -+-+-+-+-+ [[")
	console.error.apply(null, arguments);
	console.error("]] +-+-+-+-+- DAEMON ERROR -+-+-+-+-+")

}

var CHECKS = [
	function check_admin_exists(){
		userModel.findOne({"profile.username": "admin"}, (err, user)=>{
			if (err) return print_err("Could not create admin account because of: ", err);
			if (!user){
				new UsersManager().create({ 
					username: settings.app_settings.super_user.login, 
					force_password:  settings.app_settings.super_user.default_password,
					email: settings.app_settings.super_user.email,
					status: "admin"
				})
				.then(u=> print_out("Account admin created!!"))
				.catch(e=> print_err("Could not create admin account because of: ", e));
			}
		});
	},

	function removeOutdatedResourcesAndUsers(){

		resourcesModel.find({ deleteAt : {$gte : Date.now()} }, (err, resources)=>{
			resources.forEach((resource)=> {
				resourceMan.remove({rid: resource._id.toString(), noDelay:true})
				.then(()=> print_out(`Removed outdated resource "${resource._id.toString()}".`) )
				.catch(e=> print_err(`Could not remove outdated resource "${resource._id.toString()}", because`, e));
			});
		});

		userModel.find({ deleteAt : {$gte : Date.now()} }, (err, users)=>{
			users.forEach((user)=> {
				userMan.remove({uid: user._id.toString(), noDelay:true})
				.then(()=> print_out(`Removed outdated user account "${user.profile.main_email}".`) )
				.catch(e=> print_err(`Could not remove outdated user account "${user.profile.main_email}", because`, e));
			});
		});

	}
];


const runChecks = ()=>{
	//console.log("### Running DAEMON CHECKS ###");
	CHECKS.forEach(check=> check());
}

runChecks();
setInterval(runChecks, settings.app_settings.daemon_interval);