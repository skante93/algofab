
let mg = require('mongoose'), 
	Sm = mg.Schema, 
	us = new Sm({firstname: String, lastname: String}, {collection:"bidon"}), 
	um = mg.model('Users', us);

mg.connect('mongodb://172.19.0.2/test', {useNewUrlParser:true});

mg.connection.once('open', ()=>{
	console.log("Connection opened!!");
	//let u1 = new um({firstname: "Alica", lastname: "DUPONT"}), u2 = new um({firstname: "Alica", lastname: "DE GAULE"});

	//u1.save((err)=>{ console.log(err || "u1 saved!!"); });
	//u2.save((err)=>{ console.log(err || "u2 saved!!"); });

	um.find({firstname: "Alica"}).find({lastname: "DE GAULE"}).exec((err, results)=>{
		console.log(err || 'Results : '+JSON.stringify(results, null, 2));
	});
});

