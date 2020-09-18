

const multipartyForm = require('multiparty').Form, validateSpecAgainstSchema = require('./infraManager/validateSpecAgainstSchema');

const HEADERS_NOT_ALLOWED = [];

const ParamsParser2 = (definitions)=>{

	return async (req, res, next)=>{
		new multipartyForm().parse(req, async (error, fields, files)=>{
			
			const getVariableFromBody = async (v_name, schema)=>{
				
				var v_value = null;
				
				if (v_name in req.body){
					v_value = req.body[v_name];
				}
				else if (typeof fields !== 'undefined' && v_name in fields){
					if (schema.type != "array"){
						v_value = fields[v_name][0];
					}
					else {
						v_value = fields[v_name]
					}
				}
				else if (schema.required === true && !("default" in schema) ){
					return new Error(`Parameter ${v_name} is required.`);
				}

				if (schema.type == "array" && "fromString" in schema){
					if ("split" in schema.fromString && schema.fromString.split != ""){
						if (typeof v_value === 'string'){
							v_value = v_value.split(schema.fromString.split);
						}
						else if (v_value instanceof Array){
							v_value = v_value.map( e=> e.toString().split(schema.fromString.split) ).flat();
						}
						else{
							v_value = v_value.toString().split(schema.fromString.split);
						}
					}
					else if ("parse" in schema.fromString){
						try{
							v_value = JSON.parse(v_value.toString());
						}
						catch(e){
							return new Error(e);
						}
					}
				}

				if ( (typeof v_value === 'undefined' || v_value == null) && "default" in schema){
					return schema.default;
				}

				var r = await validateSpecAgainstSchema(v_value, schema);

				return r instanceof Error ? new Error(`while parsing parameter ${v_name}: ${r.toString().replace(/^Error: /, '')}`) : r;
			}

			// schema: { required: boolean, multi: boolean, extensions: Array }
			const getFileParamFromBody = (f_name, schema)=>{

				var file = null;
				if (typeof files !== 'undefined' && f_name in files){
					//
					if (schema.multiFile === true){
						file = files[f_name];
					}
					else {
						file = files[f_name][0];
					}
				}
				else if (schema.required === true){
					return new Error(`Parameter "${f_name}" is required.`);
				}
				
				if ("extensions" in schema){
					var providedExtensions = (file instanceof Array? file :[ file ]).map(e => e.originalFilename);
					for (var i=0; i<providedExtensions.length; i++){
						if (schema.extensions.indexOf(providedExtensions[i]) < 0){
							var errMsg = "";
							if (multiFile){
								errMsg = `Each file provided with the parameter "${f_name}" must have one of the following extensions : ${schema.extensions.join(', ')}`;
							}
							else{
								errMsg = `Parameter "${f_name}" must have one of the following extensions : ${schema.extensions.join(', ')}`;
							}
							return new Error(errMsg);
						}
					}
				}

				return file;
			}

			// schema: { required: boolean, default: <DEFAULT VALUE>  }
			const getVariableFromHeader = (h_name, schema)=>{
				// Default options ...
				if (HEADERS_NOT_ALLOWED.indexOf(h_name) >=0 ){
					return new Error(`You are not allowed to read header "${h_name}".`)
				}
				
				var h_value = null;

				if (h_name in req.headers ){
					h_value = req.headers[h_name];
				}
				else if (schema.required === true && !("default" in schema) ){
					return new Error(`The required parameter "${h_name}" is missing.`);
				}

				if ( (typeof h_value === 'undefined' || h_value == null) && "default" in schema){
					return schema.default;
				}

				return h_value;
			}

			// schema: { required: boolean, default: <DEFAULT VALUE>  }
			const getVariableFromURLQuery = async (q_name, schema)=>{
				// Default options ...
				var q_value = null;

				if (q_name in req.query){
					q_value = req.query[q_name];
				}
				else if (schema.required === true && !("default" in schema) ){
					return new Error(`The required parameter "${q_name}" is missing.`);
				}

				if ( (typeof q_value === 'undefined' || q_value == null) && "default" in schema){
					return schema.default;
				}
				if (schema.type == "array" && !(q_value instanceof Array)){
					q_value = [q_value];
				}
				var r = await validateSpecAgainstSchema(q_value, schema);

				return r instanceof Error ? new Error(`while parsing parameter ${q_value}: ${r.toString().replace(/^Error: /, '')}`) : r;
			}

			const getVariableFromURLPath = async (p_name, schema)=>{
				// Default options ...
				var p_value = null;

				if (p_name in req.params){
					p_value = req.params[p_name];
				}
				else if (schema.required === true && !("default" in schema) ){
					return new Error(`The required parameter "${p_name}" is missing.`);
				}

				if ( (typeof p_value === 'undefined' || p_value == null) && "default" in schema){
					return schema.default;
				}
				
				var r = await validateSpecAgainstSchema(p_value, schema);

				return r instanceof Error ? new Error(`while parsing parameter ${p_value}: ${r.toString().replace(/^Error: /, '')}`) : r;
			}


			var params = {};

			for (var k in definitions){
				var ok;

				if ("$or" in definitions[k]){
					var found = false;
					for (var i=0; i<definitions[k].$or.length; i++){
						var def = definitions[k].$or[i];

						if (def.type == "file"){
							ok =  getFileParamFromBody(k, def);
						}
						else if (def.in == "body"){
							ok = await getVariableFromBody(k, def);
						}
						else if (def.in == "header"){
							ok = getVariableFromHeader(k, def);
						}
						else if (def.in == "query"){
							ok = await getVariableFromURLQuery(k, def);
						}
						else if (def.in == "path"){
							ok = await getVariableFromURLPath(k, def);
						}
						else {
							ok = new Error(`ParserDefinitionError: for param ${k}, param location "${def.in}" is not supported`)
						}
						
						if (!(ok instanceof Error || ok == null)){
							found = true;
							break;
						}

					}

					if ( !found && definitions[k].required === true ){
						ok = new Error(`Could not parse according to any of the available definitions.`);
					}
				}
				else{
								
					if (definitions[k].type == "file"){
						ok = getFileParamFromBody(k, definitions[k]);
					}
					else if (definitions[k].in == "body"){
						ok = await getVariableFromBody(k, definitions[k]);
					}
					else if (definitions[k].in == "header"){
						ok = getVariableFromHeader(k, definitions[k]);
					}
					else if (definitions[k].in == "query"){
						ok = await getVariableFromURLQuery(k, definitions[k]);
					}
					else if (definitions[k].in == "path"){
						ok = await getVariableFromURLPath(k, definitions[k]);
					}
					else {
						ok = new Error(`ParserDefinitionError: for param ${k}, location "${definitions[k].in}" is not supported`)
					}
				}

				if (ok instanceof Error){
					//console.log("definitions: ", definitions);
					console.log(ok);
					return next(ok);
				}

				params[k] = ok;
			}

			res.locals.params = params;
			next();
		});
	}
}

const ParamsParser = (definitions)=>{

	/*
		======= Definitions Example ========

		{
			k1: { type: "string", "in": "body"}
		}
	*/
	//HEADERS_NOT_ALLOWED = [];

	return (req, res, next)=>{
		//console.log("req.body : ", req.body);
		
		new multipartyForm().parse(req, (error, fields, files)=>{
			// ===============================
			// ======= HELPER FUNCTIONS ======
			// ===============================

			// schema: { type: "..." }
			var castVariableValue = (value, schema)=>{
				
				// Expecting string
				switch (schema.type){
					// schema: { type: "string" } 
					case "string":
						console.log("value: [typeof : ", typeof value, "] : ", value);
						if (typeof value === 'undefined' || value == null)
							value = null 
						else 
							value = value.toString();
						
						if (!value) return null;

						if ("lowerCase" in schema && schema.lowerCase == true){
							return value.toLowerCase();
						}
						if ("uppperCase" in schema && schema.uppperCase == true){
							return value.toUpperCase();
						}
						return value;
						break;
					// schema: { type: "boolean" } 
					case "boolean":
						if (typeof value == 'boolean'){
							return value;
						}
						else if (typeof value == "string"){
							if (value != "true" && value != "false") {
								return new Error(`Expected a boolean but got ${value}`);
							}
							return value == "true" ? true : false; 
						}
						else {
							return new Error(`Expected a boolean but got a ${typeof value}`);
						}
						break;
					// schema: { type: "array", items : <SCHEMA | object>, stringDelimitation: <CHARACTER | string>} 
					case "array":
						//console.log("## case array, value (", typeof value, "):", value, " | schema:", schema);
						if (value instanceof Array){
							
							if (!("items" in schema)){
								return value;
							}
							var castedValue = [];

							for (var i=0; i<value.length; i++){
								var ok = castVariableValue(value[i], schema.items);
								if (ok instanceof Error){
									return new Error(`${(i+1)+((i==0)?'st':(i==1)?'nd':(i==2)?'rd':'th')} item : ${ok.toString()}`)
								}
								castedValue.push(ok);
							}
							return castedValue;
						}
						else if (typeof value == "string"){

							// if ("stringDelimitation" in schema){
							// 	return value.split(schema.stringDelimitation);
							// }
							
							try{
								//console.log("---- hi #1");
								return JSON.parse(value);
								//console.log("---- hi #2");
							}
							catch(e){
								//console.log("---- hi #3");

								valueBrackets = (!value.startsWith('[')? '[':'')+value+(!value.endsWith(']')?']':'');
								try{
									//console.log("---- hi #4");
									return JSON.parse(valueBrackets);
									//console.log("---- hi #5");
								}catch(e){
									//console.log("---- hi #6");									
									return ("stringDelimitation" in schema)? value.split(schema.stringDelimitation) : [value];
								}
								
							}
						}
						else {
							return new Error(`Expected an array but got a ${typeof value}`);
						}
						break;
					// schema: { type: "object", properties : <SCHEMA | object>, stringDelimitation: <CHARACTER | string>} 
					case "object":

						//console.log("## case object, value (", typeof value, "):", value, " | schema:", schema);
						if (value.constructor.prototype === ({}).constructor.prototype){
							
							if (!("properties" in schema)){
								return value;
							}

							var castedValue = {};

							for (var k in schema.properties){
								var ok = castVariableValue(value[k], schema.properties[k]);

								if (ok instanceof Error){
									return ok;
								}
								castedValue[k] = ok;
							}

							return castedValue;
						}
						else if (typeof value == "string"){
							
							// console.log("value : ", value, '(', typeof value, ")");
							// console.log("schema : ", schema);
							
							try{
								return castVariableValue(JSON.parse(value), schema);
							}
							catch(e){
								return new Error(`Èxpected a JSON object or a JSON formatted string, but could not parse in JSON the provided string`);
							}
						}
						else {
							return new Error(`Expected a JSON object but got ${value instanceof Array? "an array" : "a "+(typeof value)}`);
						}
						break;
					case "float":
						if (typeof value === "string"){
							if (isNaN(parseFloat(value))){
								return new Error(`Expected a float but got : ${value}`);
							}
							return parseFloat(value);
						}
						else if (typeof value !== 'number'){
							return new Error(`Expected a float but got ${value}.`);
						}
						return value;
						break;
					case "integer":
						if (typeof value === "string"){
							if (isNaN(parseInt(value))){
								return new Error(`Expected an integer but got : ${value}`);
							}
							return parseInt(value);
						}
						else if (typeof value !== 'number'){
							return new Error(`Expected an integer but got ${value}.`);
						}
						return value;
						break;
					case "date":
						if (value instanceof Date)
							return value;
						else if(typeof value === 'string'){
							var d = new Date(value);
							if (isNaN(d.getTime())){
								if (isNaN( parseFloat(value) )){
									return new Error(`Expected a Date but got ${value}.`);
								}
								else{
									return new Date(parseFloat(value));
								}
							}
							else{
								return  d;
							}
						}
						else if (typeof value === 'number'){
							return new Date(value);
						}
						else{
							return new Error(`Expected a Date but got a ${typeof value}.`);
						}
						break;
					case "file":
						return value;
						break;
					default: 
						return new Error(`Type "${schema.type}" not supported`);
						break;
				} 
			}

			// schema: {type: "...", required: boolean, default: <DEFAULT VALUE> }
			// schema(arrays): { type: "array", items, stringDelimitation; string, required: boolean, default: <DEFAULT VALUE> }
			const getVariableFromBody = (v_name, schema)=>{

				// Default options ...
				var options = {};

				if ( !("required" in schema) || typeof schema.required === 'undefined' || schema.required == null ){
					options.required = false;
				}
				else{
					options.required = schema.required;
				}
				if ( "default" in schema ){
					options.default = schema.default;
				}
				options.isArray = schema.type == "array";
				

				// Get Parameter's value ...
				if (v_name in req.body) {
					if (options.isArray && !(req.body[v_name] instanceof Array)){
						return new Error(`Expected an array bit git ${typeof req.body[v_name]}`);
					}
					
					return castVariableValue(req.body[v_name], schema);
				}
				else {
					var exists = typeof fields !== 'undefined' && (v_name in fields);

					if (options.required && !exists ){
						return new Error(`The required parameter "${v_name}" is missing.`);
					}
					else if ( !exists ){
						return "default" in options ? options.default : null;
					}

					var value;
					if (options.isArray){
						value = fields[v_name].length != 1? fields[v_name] : fields[v_name][0];

						if (typeof value === "string"){
							try{
								//console.log("parsing str t array #1 : ", value);
								value = JSON.parse(value);
							}catch(e){
								//console.log("parsing str t array #1 Oupsy: ", e);
								var valueBrackets = (!value.startsWith('[')?'[':'')+value+(!value.endsWith(']')?']':'');
								try{
									//console.log("parsing str t array #2 : ", value);
									value = JSON.parse(valueBrackets);
								}
								catch(e){
									//console.log("parsing str t array #2 Oupsy: ", e);
									value = ("stringDelimitation" in schema)? value.split(schema.stringDelimitation) : [value];
								}
							}
						}
					}
					else{
						value = fields[v_name][0];
					}

					return castVariableValue( value, schema);
				}
			}

			// schema: { required: boolean, multi: boolean, extensions: Array }
			const getFileParamFromBody = (f_name, schema)=>{
				// Default options ...
				var options = {};

				if ( !("required" in schema) || typeof schema.required === 'undefined' || schema.required == null ){
					options.required = false;
				}
				if ( "default" in schema ){
					options.default = schema.default;
				}


				if ( "extensions" in schema ){
					options.extensions = schema.extensions;
				}
				
				if ( !("multi" in schema ) || schema.multi == false ){
					options.isFile = true;
					options.isMultiFile = false;
				}
				else{
					options.isFile = false;
					options.isMultiFile = true;
				}
				
				if (typeof files === 'undefined') return null;

				var exists = typeof files !== 'undefined' && (f_name in files);
				// Get Parameter's value ...
				if (options.required && !exists ){
					return new Error(`The required parameter "${f_name}" (file type) is missing.`);
				}
				else if ( !exists){
					return null;
				}

				// Checking extensions when precised
				if ("extensions" in options){
					var expectedFiles = files[f_name];
					for (var i=0; (options.isMultiFile && i < expectedFiles.length) || (options.isFile && i < 1); i++ ){
						var ok = options.extensions.map(ext => expectedFiles[i].originalFilename.toLowerCase().endsWith('.'+ext.toLowerCase())).reduce( (a,b)=> a || b );
						if (!ok){
							return new Error(`The parameter "${f_name}" must have one of the following extensions : ${options.extensions.join(', ')}`);
						}
					}
				}
				return castVariableValue(options.isMultiFile ? files[f_name] : files[f_name][0], schema);
			}

			// schema: { required: boolean, default: <DEFAULT VALUE>  }
			const getVariableFromHeader = (h_name, schema)=>{
				// Default options ...
				var options = {};

				if ( !("required" in schema) || typeof schema.required === 'undefined' || schema.required == null ){
					options.required = false;
				}
				else{
					options.required = schema.required;
				}
				if ( "default" in schema ){
					options.default = schema.default;
				}

				// Get parameter's value ...
				if (HEADERS_NOT_ALLOWED.indexOf(h_name) >=0 ){
					return new Error(`You are not allowed to read header "${h_name}".`)
				}

				if (options.required && !(h_name in req.headers) ){
					return new Error(`The required parameter "${h_name}" is missing.`);
				}
				else if( !(h_name in req.headers) ){
					return "default" in options ? options.default : null;
				}

				return castVariableValue(req.headers[h_name], schema);
			}

			// schema: { required: boolean, default: <DEFAULT VALUE>  }
			const getVariableFromURLQuery = (q_name, schema)=>{
				// Default options ...
				var options = {};

				if ( !("required" in schema) || typeof schema.required === 'undefined' || schema.required == null ){
					options.required = false;
				}
				else{
					options.required = schema.required;
				}
				if ( "default" in schema ){
					options.default = schema.default;
				}


				// Get parameter's value ...
				if (options.required && !(q_name in req.query) ){
					return new Error(`The required parameter "${q_name}" is missing.`);
				}
				else if( !(q_name in req.query) ){
					return "default" in options ? options.default : null;
				}

				return castVariableValue(req.query[q_name], schema);
			}

			const getVariableFromURLPath = (p_name, schema)=>{
				// Default options ...
				var options = {};

				if ( !("required" in schema) || typeof schema.required === 'undefined' || schema.required == null ){
					options.required = false;
				}
				else{
					options.required = schema.required;
				}
				if ( "default" in schema ){
					options.default = schema.default;
				}


				// Get parameter's value ...
				if (options.required && !(p_name in req.params) ){
					return new Error(`The required parameter "${p_name}" is missing.`);
				}
				else if( !(p_name in req.params) ){
					return "default" in options ? options.default : null;
				}

				return castVariableValue(req.params[p_name], schema);
			}


			// ==============================
			// ======== BEGIN PARSING =======
			// ==============================

			var params = {};

			for (var k in definitions){
				var ok;

				if ("$or" in definitions[k]){
					
					for (var i=0; i<definitions[k].$or.length; i++){
						var def = definitions[k].$or[i];

						if (def.type == "file"){
							ok = getFileParamFromBody(k, def);
						}
						else if (def.in == "body"){
							ok = getVariableFromBody(k, def);
						}
						else if (def.in == "header"){
							ok = getVariableFromHeader(k, def);
						}
						else if (def.in == "query"){
							ok = getVariableFromURLQuery(k, def);
						}
						else if (def.in == "path"){
							ok = getVariableFromURLPath(k, def);
						}
						else {
							ok = new Error(`ParserDefinitionError: for param ${k}, param location "${def.in}" is not supported`)
						}
						
						if (!(ok instanceof Error || ok == null)){
							break;
						}

					}

					var found = !(ok instanceof Error || ok == null);

					if (!found && ("required" in definitions[k] && definitions[k].required == true)){
						ok = new Error(`Could not parse according to any of the available definitions.`);
					}
				}
				else{
								
					if (definitions[k].type == "file"){
						ok = getFileParamFromBody(k, definitions[k]);
					}
					else if (definitions[k].in == "body"){
						ok = getVariableFromBody(k, definitions[k]);
					}
					else if (definitions[k].in == "header"){
						ok = getVariableFromHeader(k, definitions[k]);
					}
					else if (definitions[k].in == "query"){
						ok = getVariableFromURLQuery(k, definitions[k]);
					}
					else if (definitions[k].in == "path"){
						ok = getVariableFromURLPath(k, definitions[k]);
					}
					else {
						ok = new Error(`ParserDefinitionError: for param ${k}, location "${definitions[k].in}" is not supported`)
					}
				}

				if (ok instanceof Error){
					//console.log("definitions: ", definitions);
					console.log(ok);
					return next(ok);
				}
				params[k] = ok;
			}

			res.locals.params = params;
			next();
		});
	}
}
 
module.exports = ParamsParser2;