

var validateSpecAgainstSchema = async (obj, schema, trace)=>{
	//
	if (typeof trace === 'undefined') trace = "";

	if (typeof obj === 'undefined'){
		if("required" in schema && schema.required == true){
			//
			return new Error(`${trace? trace+" : ":""} required but not specified`);
		}

		if ("default" in schema){
			if (typeof schema.default === 'function'){
				if (schema.default.constructor.prototype === (async ()=>{}).constructor.prototype){
					return await schema.default();
				}
				return schema.default();
			}
			return schema.default;
		}

		return null;
	}

	if (schema.type == "object"){
		//
		if (obj.constructor.prototype !== ({}).constructor.prototype){
			return new Error(`${trace? trace+" : ":""}expected object but got ${obj instanceof Array ? "array" : typeof obj}`);
		}
		if ("notEmpty" in schema && schema.notEmpty == true && Object.keys(obj).length == 0){
			return new Error(`${trace? trace+" : ":""}object cannot be empty.`);
		}
		if ( !("properties" in schema && schema.properties) ){
			return obj;
		}
		
		var r = {};
		
		if ('*' in schema.properties){
			//
			for(var p in obj){
				if ("keysMatch" in schema.properties['*'] && ! (new RegExp(schema.properties['*'].keysMatch).test(p)) ){
					return new Error(`${trace? trace+" : ":""}object key ${p} should match the following regex: ${schema.properties['*'].keysMatch}.`)
				}
				r[p] = await validateSpecAgainstSchema(obj[p], schema.properties['*'], trace+" > "+p);

				if (r[p] instanceof Error){
					return r[p];
				}
			}
		}
		else{
			for (var p in schema.properties){
				if (p.startsWith('!')){
					//
					var forbidden_key = p.substring("!");
					if (forbidden_key in obj){
						return new Error(`${trace? trace+" : ":""}field "${forbidden_key}" is not supposed to be present.`)
					}
				}
				else{
					if (schema.properties[p].required == true && !(p in obj)){
						return new Error(`${trace? trace+" : ":""}field "${p}" required.`);
					}
					var v = await validateSpecAgainstSchema(obj[p], schema.properties[p], trace+" > "+p);
					
					if (v instanceof Error){
						return v;
					}

					if (v !== null){
						r[p] = v;
					}
				}
			}
		}
		return r;
	}
	else if (schema.type == "array"){
		//
		if (!(obj instanceof Array)){
			return new Error(`${trace? trace+" : ":""}expected an array but got ${typeof obj}`);
		}
		
		if ("notEmpty" in schema && schema.notEmpty == true && obj.length == 0){
			return new Error(`${trace? trace+" : ":""}array cannot be empty.`);
		}

		if ( !("items" in schema && schema.items) ){
			return obj;
		}

		var r = [];
		for (var i=0; i<obj.length; i++){
			var err = await validateSpecAgainstSchema(obj[i], schema.items, trace+" ["+i+"] ");
			
			if (err instanceof Error){
				return err;
			}
			if (err != null){
				r.push(err);
			}
		}
		return r;
	}
	else if (schema.type == "integer"){
		//
		if (typeof obj !== 'number'){
			return new Error(`${trace? trace+" : ":""}expected an integer but got ${obj instanceof Array ? "array" : typeof obj}`);
		}
		var v = parseInt(obj);

		if ( "min" in schema && v < schema.min ){
			return new Error(`${trace? trace+" : ":""}value cannont be less than ${schema.min}`);
		} 
		if ( "max" in schema && v > schema.max ){
			return new Error(`${trace? trace+" : ":""}value cannont be more than ${schema.max}`);
		} 
		return v;
	}
	else if (schema.type == "string"){
		if (typeof obj !== 'string'){
			return new Error(`${trace? trace+" : ":""}expected a string but got ${obj instanceof Array ? "array" : typeof obj}`);
		}
		if ("process" in schema){
			var v;
			if (schema.process.constructor.prototype === (async ()=>{}).constructor.prototype){
				v = await schema.process(obj);
			}
			else {
				v = schema.process(obj);
			}
			return v;
		}
		return obj;
	}
	else{
		//
		return new Error(`${trace? trace+" : ":""}schema type "${schema.type}" not (yet) supported.`)
	}
}

const test = async function(){
	console.log("### TESTING validateSpecAgainstSchema FUNTION ###");
	const hostPorts = require('../hostPorts');

	var res = await validateSpecAgainstSchema(
		{
			image: "toto",
			ports: [
				{
					app_protocol: "http",
					container_port: 28,
					//host_port: 30002
				}
			]
		},
		{
			type: "object",
			properties: {
				image: { type: "string", required: true},
				ports: {
					type: "array",
					required: true,
					items: {
						type: "object",
						properties: {
							app_protocol: { type: "string", required: true },
							container_port: { type: "integer", required: true},
							host_port: { type: "integer", min: 30000, max: 32767, default: hostPorts.randomAvailablePortSync }
						}
					}
				}
			}
		}
	)

	console.log(res);
	var res = await validateSpecAgainstSchema(
		{
			version: "3",
			services: {
				svc1: {
					image: "toto:1",
				}
			},
			volumes: {
				v1: {}
			}
		},
		{
			type: "object",
			required: true,
			properties: {
				version: { type: "string", required: true},
				services: { 
					type: "object", 
					required: true,
					notEmpty: true,
					properties: {
						'*': {
							type: "object",
							required: true,
							//keysMatch: '^[a-z0-9]+$',
							properties: {
								image: { type: "string", required: true, process: (name)=> { return name.split(':').length == 1? name+":latest": name} },
								volumes: {
									type: "array",
									items: { type: "string" }
								}
							}
						}
					} 
				},
				volumes: {
					type: "object",
					properties: {
						'*': { type: "object"}
					}
				}
			}
		}
	)

	console.log(res);
}

//test();

module.exports = validateSpecAgainstSchema;