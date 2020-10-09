
const express = require('express'), multiparty = require('multiparty'), fs = require('fs'), cors = require('cors');


var objectType = (o)=>{
    switch (typeof o){
        case 'object':
            return o instanceof Array? 'array' : 'object'
            break;
        default:
            return typeof o;
    }
}


var isObject = (o)=> {
    return typeof o !== undefined && o != null &&
        o.constructor.prototype === ({}).constructor.prototype;
}

var is_multiparty_file = (o)=>{
    if (!isObject(o)){
        console.log("not object!!!!!");
        return false;
    }

    /*
    for (var filename in o){
        if ( !(o[filename] instanceof Array && 'originalFilename' in o[filename][0] && 'headers' in o[filename][0] && 'path' in o[filename][0]) ){
            return false;
        }
    }
    */
    if ( !('originalFilename' in o && 'headers' in o && 'path' in o) ){
        return false;
    }
    return true;
}


class ParamsDefinitions {
    constructor(full_path, method, swaggerOptions, swaggerServerConfig) {
        this.full_path = full_path;
        this.method = method
        this.swaggerOptions = swaggerOptions;
        this.swaggerServerConfig = swaggerServerConfig;
    }

    get_swagger_definiton_from_ref(ref) {
        if (typeof ref === 'undefined' || ref == null || ref == '' ){
            return new Error('a reference can neither be null nor empty')
        }

        var refs = ref.replace(/^\#\//, '').split('/');
        var current_ref = JSON.parse(JSON.stringify(this.swaggerOptions));
        
        for (var i=0; i<refs.length; i++){
            //console.log("refs[i] : ", refs[i]);
            if ( !(refs[i] in current_ref) ){
                return new Error(`reference ${ref} is wrong, no definition found there`);
            }
            current_ref = JSON.parse(JSON.stringify(current_ref[ refs[i] ]));
        };
        return current_ref;
    }
    
    retrieve_schema(schema){
        //console.log("DBG, ", schema);
        const { API_METHODS, SCHEMA_VALID_OPTIONS } = this.swaggerServerConfig;
        

        if (typeof schema === 'string'){
            var opts = Object.keys(SCHEMA_VALID_OPTIONS.FORMATS);
            if (opts.indexOf(schema) < 0){
                return new Error(`schema type ${schema} is invalid, the right options are : ${opts.join(', ')}`);
            }
            return { type: schema };
        }
        else if (!isObject(schema)){
            //console.log("##### schema was : ", schema);
            return new Error(`schema is expected to be anobject not a ${objectType(schema)}`);
        }

        if ('schema' in schema) {
            return this.retrieve_schema(schema.schema);
        }

        for (var s in schema ){
            //console.log("s : ", s);
            if (s != "name" && s != "in" && s != "$ref"){ // those will exist when describing parameter (as opposed to requestBodies)
                if (SCHEMA_VALID_OPTIONS.KNOWN.indexOf(s) < 0){
                    return new Error(`schema option ${s} is invalid, the right options are : ${SCHEMA_VALID_OPTIONS.KNOWN.join(', ')}`);
                }
                else if (SCHEMA_VALID_OPTIONS.SUPPORTED.indexOf(s) <0 ){
                    return new Error(`sorry, schema option ${s} is not yet supported, supported options are  : ${SCHEMA_VALID_OPTIONS.SUPPORTED.join(', ')}`);    
                }
            }
        }

        var recomposed_schema;

        if ('type' in schema && '$ref' in schema) {
            return new Error('both fields "type" and "$ref" canont be specified, please remove one')
        }
        else if ( !('type' in schema || '$ref' in schema || 'allOf' in schema) ){
            return new Error('you need to specify either one of the following schema options: "type", "$ref", "allOf"')    
        }

        if ('$ref' in schema){
            var def = this.get_swagger_definiton_from_ref(schema.$ref);
            //console.log('def : ', def);
            return this.retrieve_schema(def);
        }
        else if ('allOf' in schema){
            if ( !(schema.allOf instanceof Array) ){
                return new Error(`schema options is expected to be an array but got a ${objectType(schema.allOf)}`);
            }

            recomposed_schema = { type: "object", properties : {} };

            for (var i=0; i<schema.allOf.length; i++){
                var s = this.retrieve_schema(schema.allOf[i]);
                if (s instanceof 'Error') {
                    s.message = `item ${i} of schema option "allOf", ${s.message}`;
                    return s;
                }
                if (s.type != 'object'){
                    return new Error(`item ${i} of schema option "allOf", expected an "object" type but got a ${s.type} type`);
                }
                if ("properties" in s) {
                    for (var p in s.properties){
                        recomposed_schema.properties[p] = s.properties[p];
                    }
                }
            }
            return recomposed_schema;
        }
        else { // "type" in schema
            //Start off with the complex schema types 
            if (schema.type == 'object'){
                //
                recomposed_schema = {type: 'object', properties: {}};
                if ('properties' in schema){
                    for (var p in schema.properties){
                        var s = this.retrieve_schema(schema.properties[p]);
                        if (s instanceof Error){
                            s.message = `in schema type "object", property ${p}, ${s.message}`;
                            return s;
                        }
                        recomposed_schema.properties[p] = s;
                    }
                }
                return recomposed_schema;
            }
            else if (schema.type == 'array') {
                //
                recomposed_schema = { type: 'array' };

                if('items' in schema){
                    var s = this.retrieve_schema(schema.items);
                    if (s instanceof Error){
                        s.message = `in schema type "array", items, ${s.message}`;
                        return s;
                    }
                    recomposed_schema.items = s;
                }
                return recomposed_schema;
            }

            // Then check primitive types
            if (Object.keys(SCHEMA_VALID_OPTIONS.FORMATS).indexOf(schema.type) < 0){
                return new Error(`schema type "${schema.type}" do not exist, plase select one of the following instead : object, array, ${Object.keys(SCHEMA_VALID_OPTIONS.format).join(', ')}`);
            }

            if ('format' in schema && SCHEMA_VALID_OPTIONS.FORMATS[schema.type].indexOf(schema.format) < 0){
                return new Error(`schema type "string" can't have a format ${schema.format}, please select one of the following instead : ${SCHEMA_VALID_OPTIONS.FORMATS[schema.type].map(e=> e==''?'<empty string>':e).join(', ')}`);
            }

            if ( !('description' in schema) ) {
                schema.description = 'TODO';
            }

            if (schema.type == 'string'){
                //
                recomposed_schema = { type: 'string' };
                ['format', 'maxLength', 'minLength', 'enum', 'pattern', 'required', 'example', 'default'].forEach(opt=>{
                    if (opt in schema) {
                        recomposed_schema[opt] = schema[opt];
                    }
                });
            }
            else if (schema.type == 'integer' || schema.type == 'number'){
                //
                recomposed_schema = { type: schema.type };
                ['minimum', 'maximum', 'required', 'example', 'default'].forEach(opt=>{
                    if (opt in schema) {
                        recomposed_schema[opt] = schema[opt];
                    }
                });
            }
            else if (schema.type == 'boolean'){
                recomposed_schema = { type: 'string' };
                ['required', 'example', 'default'].forEach(opt=>{
                    if (opt in schema) {
                        recomposed_schema[opt] = schema[opt];
                    }
                });
            }

            return recomposed_schema;
        }
    }

    fromParameters(param_definition, position, consumes){
        this.is_request_body_param = false;
        this.from_multipart_body = consumes && consumes.map(c=> c == 'multipart/form-data').reduce ((a,b)=> a||b);
        if ( !('name' in param_definition) ){
            throw new Error(`In path ${this.full_path}, method ${this.method}, parameter at position ${position}: field "name" is missing`);
        }
        if ( !('in' in param_definition) ){
            throw new Error(`In path ${this.full_path}, method ${this.method}, parameter at position ${position}: field "in" is missing`);
        }
        if ( !('type' in param_definition || 'schema' in param_definition) ){
            throw new Error(`In path ${this.full_path}, method ${this.method}, parameter at position ${position}: neither field "type" nor "schema" is specified`);
        }
        else if ('type' in param_definition && 'schema' in param_definition){
            throw new Error(`In path ${this.full_path}, method ${this.method}, parameter at position ${position}: both fields "type" and "schema" are specified, please remove one`);
        }
        /*
        else{
            if ('type' in param_definition) {
                param_definition.schema = { type : param_definition.type };
                delete param_definition.type;
            }
        }
        */

        if ( !('description' in param_definition) ){
            param_definition.description = "TODO";
        }
        //console.log("param_definition : ", param_definition);
        var s = this.retrieve_schema('type' in param_definition ? param_definition.type : param_definition.schema);
        if (s instanceof Error){
            s.message = `In path  ${this.full_path}, method ${this.method}, parameter at position ${position}: ${s.message}`;
            throw s;
        }
        this.param_schema = { schema : s };
        this.param_schema.name = param_definition.name;
        this.param_schema.in = param_definition.in;
        this.param_schema.required = param_definition.required;

        return this;
    }

    fromRequestBody(param_definition, content_type, all_content_types){
        
        this.is_request_body_param = true;
        this.content_type = content_type;
        this.all_content_types = all_content_types;

        var s = this.retrieve_schema(param_definition);
        if (s instanceof Error){
            console.log(s);
            s.message = `In path  ${this.full_path}, method ${this.method}, requestBody content: ${s.message}`;
            throw s;
        }
        //console.log("request body schema [", content_type, '] : ',s);
        this.param_schema = {schema : s};

        return this;
    }

    parse_param (submitted, schema){
        //console.log("parse_param : schema : ", schema);
        if (typeof submitted === 'undefined' || submitted == null){
            if (schema.default) {
                return schema.default;
            }
            else if(schema.required === true){
                return new Error(`parameter is required but not provided`);
            }
            else {
                return null;
            }
        }

        var value;
        
        switch(schema.type) {
            case 'object':
                try {
                    value = isObject(submitted)? JSON.parse(JSON.stringify(submitted)) : typeof submitted === 'string' ? JSON.parse(submitted) : new Error(`expected object type but got ${objectType(submitted)}`);
                    if (value instanceof Error){
                        return value;
                    }
                }
                catch(e){
                    //
                    return new Error(`could not parse provided parameter into object`);
                }

                if ( !('properties' in schema)){
                    return value;
                }

                for (var p in schema.properties){
                    value[p] = this.parse_param(value[p], schema.properties[p]);
                    if (value[p] instanceof Error){
                        value[p].message = `objct field "${p}", ${value[p].message}`;
                        return value[p];
                    }
                }
                return value;
                break;
            case 'array':
                //console.log("Got here!!!!!");
                try{
                    if (submitted instanceof Array){
                        value = submitted;
                    }
                    else if (typeof submitted === 'string'){
                        //
                        try{
                            value = JSON.parse(submitted);
                        }
                        catch(e){
                            try {
                                value = JSON.parse('['+submitted+']');
                            } catch (e) {
                                value = new Error(`could not parse value into array`);
                            }
                        }
                    }
                    else {
                        value = new Error(`expected array type but got ${objectType(submitted)}`);
                    }

                    if (value instanceof Error){
                        return value;
                    }
                    if ( !(value instanceof Array) ){
                        return new Error(`expected an array but got ${objectType(value)}`);
                    }
                }
                catch(e){
                    console.log("HERE YOU ARE!!", e);
                    return new Error(`could not parse provided parameter into an array`);    
                }
                
                if ( !('items' in schema) ){
                    return value;
                }

                for (var i=0; i<value.length; i++){
                    value[i] = this.parse_param(value[i], schema.items);
                    if (value[i] instanceof Error){
                        value[i].message = `array at position "${i}", ${value[i].message}`;
                        return value[i];
                    }
                }
                return value;
                break;
            case 'integer':
                try{
                    value = typeof submitted === 'number' || typeof submitted === 'string'? parseInt(submitted) : new Error(`expected an intger type but got ${objectType(submitted)}`);
                    if (value instanceof Error){
                        return value;
                    }
                }
                catch(e){
                    return new Error(`could not parse provided parameter into an integer`);    
                }

                if ('minimum' in schema && value < schema.minimum){
                    return new Error(`value can't be less than ${schema.minimum}`);
                }
                if ('maximum' in schema && value > schema.maximum){
                    return new Error(`value can't be greater than ${schema.maximum}`);
                }
                return value;
                break;
            case 'number':
                try{
                    value = typeof submitted === 'number' || typeof submitted === 'string'? parseFloat(submitted) : new Error(`expected a number type but got ${objectType(submitted)}`);
                    if (value instanceof Error){
                        return value;
                    }
                }
                catch(e){
                    return new Error(`could not parse provided parameter into a number`);    
                }

                if ('minimum' in schema && value < schema.minimum){
                    return new Error(`value can't be less than ${schema.minimum}`);
                }
                if ('maximum' in schema && value > schema.maximum){
                    return new Error(`value can't be greater than ${schema.maximum}`);
                }
                return value;
                break;
            case 'string':
                if ('format' in schema && schema.format == 'binary'){
                    //
                    var multiparted = submitted instanceof Array ? submitted.map(f=> is_multiparty_file(f)).reduce((a,b)=>a&&b) : is_multiparty_file(submitted);
                    if (multiparted){
                        value = submitted;
                    }
                    else{
                        console.log("multiparted : [", multiparted instanceof Array ? 'array': typeof multiparted, "] : ", multiparted);
                        return new Error(`expected a file`);
                    }
                    return value;
                }
                else {
                    value = submitted.toString();

                    if ('minLength' in schema && value.length < schema.minLength){
                        return new Error(`parameter is expected to have at least ${schema.minLength} characters but got only ${value.length}`);
                    }
                    if ('maxLength' in schema && value.length > schema.maxLength){
                        return new Error(`parameter is expected to have at most ${schema.maxLength} characters but got ${value.length}`);
                    }
                    if ('enum' in schema && schema.enum.indexOf(value) < 0){
                        return new Error(`parameter is expected to take one of the following values: ${schema.enum.join(', ')}`);
                    }
                    if ('pattern' in schema && new RegExp(schema.pattern).test(value) < 0){
                        return new Error(`parameter is expected to match the following pattern: ${schema.pattern}`);
                    }

                    return value;
                }

                break;
            case 'boolean': 
                if (typeof submitted !== 'boolean' && typeof submitted != 'string'){
                    return new Error(`expected a boolean but got "${typeof submitted}"`);
                }
                if (typeof submitted == 'string'){
                    return submitted == 'true'? true : false;
                }
                else {
                    return submitted;
                }
        }
    }

    get_parse_middleware () {
        if (this.middleware) return this.middleware;

        var middleware;

        if (this.is_request_body_param === true){
            //
            var param_schema = this.param_schema.schema;
            middleware = (req, res, next)=>{
                //console.log("requestBody middleware [", this.content_type, ']');
                var expected_ct = this.all_content_types.map(ct=> new RegExp(ct).test(req.headers['content-type'])).reduce((a,b)=>a||b);
                
                if (! expected_ct ){
                    return next (new Error(`the requestBody content type "${req.headers['content-type']}" is not expected, choose one of the following : ${this.all_content_types.join(', ')}`));
                }
                
                if (!new RegExp(this.content_type).test(req.headers['content-type'])){
                    return next();
                }
                
                if (this.content_type === 'multipart/form-data'){
                    
                    var form = new multiparty.Form();
                    form.parse(req, (error, fields, files)=>{
                        //
                        if (error){
                            console.log("fields : ", fields, " | files : ", files);
                            console.log("error : ", error);
                            return res.status(500).json({ body: "wrongly formatted mulipart request" })
                        }
                        //console.log("fields : ", fields, " | files : ", files);

                        
                        if (param_schema.type === "object" ){
                            for (var name in param_schema.properties){
                                //console.log("mane :", name, " | param_schema.properties[name]: ", param_schema.properties[name]);
                                if (param_schema.properties[name].type === "string" && param_schema.properties[name].format === "binary"){
                                    //
                                    var submitted = files[name] && files[name].length > 1 ? files[name] : name in files? files[name][0] : null;
                                    //console.log('submitted [', name, ']: ', submitted);
                                    
                                    var value = this.parse_param(submitted, param_schema.properties[name]);
                                    if (value instanceof Error){
                                        //console.log("err : ", value);
                                        return res.status(405).json({ body: `requesBody "${name}" : ${value.message}`});
                                    }

                                    if (typeof res.locals.params === 'undefined') {
                                        res.locals.params = {};
                                    }
                                    res.locals.params[ name ] = value;
                                }
                                else{ 
                                    //console.log('fields : ', fields);
                                    //console.log('files : ', files);
                                    //var v = fields[name];
                                    //console.log("v: [", name, "][", v instanceof Array ? 'array' : typeof v, "] : ", v);
                                    console.log('fields[', name,'] : ', fields[name])
                                    console.log("param_schema: ", param_schema);
                                    //console.log(".. checking out \"", name, "\"");
                                    var submitted = name in fields ? fields[name][0]: null;
                                    submitted = submitted === '' ? null : submitted;
                                    
                                    var value = this.parse_param(submitted, param_schema.properties[name]);
                                    if (value instanceof Error){
                                        return res.status(400).json({ body: `requestBody "${param_schema.name}" : ${value.message}`});
                                    }

                                    if (typeof res.locals.params === 'undefined') {
                                        res.locals.params = {};
                                    }
                                    res.locals.params[ name ] = value;
                                }
                            }
                        }
                        else{
                            return res.status(400).json({body: `Non-object requestBody not yet supported`});
                        }
                        
                        next();
                    });
                }
                else{
                    
                    var value = this.parse_param(JSON.stringify(req.body), param_schema);
                    if (value instanceof Error){
                        console.log("reched here, err : ", value);
                        return res.status(400).json({ body: `requestBody : ${value.message}`});
                    }
                    
                    if (typeof res.locals.params === 'undefined') {
                        res.locals.params = {};
                    }
                    if (param_schema.type == 'object'){
                        for (var p in value) {
                            res.locals.params[ p ] = value[p];
                        }
                    }
                    else {
                        res.locals.params.body = value;
                    }

                    next();
                }
            }
        }
        else{
            //
            middleware = (req, res, next)=>{
                if (this.param_schema.in == 'header'){
                    var value = this.parse_param(req.headers[ this.param_schema.name.toLowerCase() ], this.param_schema.schema);
                    if (value instanceof Error){
                        return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                    }
                    if (typeof res.locals.params === 'undefined') {
                        res.locals.params = {};
                    }
                    res.locals.params[ this.param_schema.name ] = value;
                    
                    next();
                }
                else if (this.param_schema.in == 'query'){
                    //console.log("Got here!![", this.param_schema.name, "] : ", req.query);
                    var v = req.query[ this.param_schema.name ];
                    if (this.param_schema.schema.type == "array"){
                        v = v instanceof Array ? v : [v];
                    }
                    else{
                        v = v instanceof Array ? v[0] : v;
                    } 
                    //console.log("v [", this.param_schema.name, "] [", this.param_schema.schema.type, "] : ", v);
                    var value = this.parse_param( v , this.param_schema.schema);
                    //console.log('parsed value ', this.param_schema.name, " : ", value);
                    if (value instanceof Error){
                        return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                    }
                    if (typeof res.locals.params === 'undefined') {
                        res.locals.params = {};
                    }
                    res.locals.params[ this.param_schema.name ] = value;

                    next();
                }
                else if (this.param_schema.in == 'path'){
                    var value = this.parse_param(req.params[ this.param_schema.name ], this.param_schema.schema);
                    if (value instanceof Error){
                        return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                    }
                    if (typeof res.locals.params === 'undefined') {
                        res.locals.params = {};
                    }
                    res.locals.params[ this.param_schema.name ] = value;

                    next();
                }
                else if (this.param_schema.in == 'body'){
                    if ( new RegExp('multipart/form-data').test(req.headers['content-type']) ){
                        var form = new multiparty.Form();
                        form.parse(req, (error, fields, files)=>{
                            //
                            if (error){
                                return res.status(400).json({ body: "wrongly formatted mulipart request" })
                            }

                            if (this.param_schema.schema.type === "string" && this.param_schema.format === "binary"){
                                var submitted = files[this.param_schema.name] && files[this.param_schema.name].length > 1 ? files[this.param_schema.name] : files[this.param_schema.name][0];
                                
                                var value = this.parse_param(submitted, this.param_schema.schema);
                                if (value instanceof Error){
                                    return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                                }

                                if (typeof res.locals.params === 'undefined') {
                                    res.locals.params = {};
                                }
                                res.locals.params[ this.param_schema.name ] = value;
                            }
                            else{
                                var value = this.parse_param(fields[this.param_schema.name][0], this.param_schema.schema);
                                if (value instanceof Error){
                                    return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                                }

                                if (typeof res.locals.params === 'undefined') {
                                    res.locals.params = {};
                                }
                                res.locals.params[ this.param_schema.name ] = value;
                            }
                            next();
                        });
                    }
                    else{
                        var value = this.parse_param(req.body[ this.param_schema.name ], this.param_schema.schema);
                        if (value instanceof Error){
                            return res.status(400).json({ body: `Parameter ${this.param_schema.name} : ${value.message}`});
                        }
                        if (typeof res.locals.params === 'undefined') {
                            res.locals.params = {};
                        }
                        res.locals.params[ this.param_schema.name ] = value;

                        next();
                    }
                }
            }
        }

        return middleware;
    }

    get_specification () {
        return this.param_schema;
    }
}

class SwaggerPath {
    constructor(path_name, prefix, path_config, swaggerOptions, swaggerServerConfig){
        this.path_config = JSON.parse(JSON.stringify(path_config));
        this.path_name = path_name;
        this.prefix = prefix? prefix : '';
        this.swaggerOptions = swaggerOptions;
        
        this.swaggerServerConfig = swaggerServerConfig;

        // console.log('SwaggerPath Constructor : [path_name] : ',path_name, ' | [prefix] : ', prefix);
        // console.log('SwaggerPath : [path_name] : ',this.path_name, ' | [prefix] : ', this.prefix);
        this.setup();
    }
    
    get_full_path (){
        return this.prefix + (this.path_name.startsWith("/")? '' : '/') + this.path_name.replace(/\/$/, '');
    }

    apply_defaults(path_definition) {
        ['description', 'summary', 'responses'].forEach((opt)=>{
            if ( !(opt in path_definition) ){
                if (opt == 'responses'){
                    path_definition[opt] = {};
                }
                else{
                    path_definition[opt] = 'TODO';
                }
            }
        });

        if ('requestBody' in path_definition && !('description' in path_definition.requestBody && path_definition.requestBody.description)){
            path_definition.requestBody.description = 'TODO';
        }
    }

    setup(){
        if (!isObject(this.path_config)){
            throw new Error(`Path ${this.get_full_path()}: the specification expects an object but got an ${objectType(this.path_config)}`)
        }
        const { API_METHODS } = this.swaggerServerConfig;

        for (var method in this.path_config){
            if (API_METHODS.indexOf(method) < 0) {
                throw new Error(`In path ${this.get_full_path()}: method "${method}" not suported, try one of these instead: ${API_METHODS.join(', ')}`);
            }
            if (!isObject(this.path_config[method])){
                throw new Error(`In path ${this.get_full_path()}, method ${method}: the specification expects an object but got an ${objectType(this.path_config[method])}`);
            } 
            var path_definition = this.path_config[method];
            this.apply_defaults(path_definition);

            // Check the availablity of required params
            ['handler'].forEach((field)=>{
                if (typeof path_definition[field] === 'undefined' || path_definition[field] == null){
                    throw new Error(`In path ${this.get_full_path()}, method ${method}: field "${field}" is mandatory but not have not been specified.`);
                }
            });
            
            // check specified params as well as their respective formats
            for (var field in path_definition){
                switch (field) {
                    case 'summary':
                        if (typeof path_definition[field] !== 'string'){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects a string but got a :${objectType(path_definition[field])}`);
                        }
                        break;
                    case 'description':
                        if (typeof path_definition[field] !== 'string'){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects a string but got a :${objectType(path_definition[field])}`);
                        }
                        break;
                    case 'tags':
                        if ( !(path_definition[field] instanceof Array) ){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array but got a :${objectType(path_definition[field])}`);
                        }
                        for (var i=0; i<path_definition[field].length; i++){
                            if (typeof path_definition[field][i] !== 'string'){
                                throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array of strings but got in position ${i} a :${objectType(path_definition[field][i])}`);
                            }    
                        }
                        break;
                    case 'consumes':
                        if ( !(path_definition[field] instanceof Array) ){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array but got a :${objectType(path_definition[field])}`);
                        }
                        for (var i=0; i<path_definition[field].length; i++){
                            if (typeof path_definition[field][i] !== 'string'){
                                throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array of strings but got in position ${i} a :${objectType(path_definition[field][i])}`);
                            }    
                        }
                        break;
                    case 'produces':
                        if ( !(path_definition[field] instanceof Array) ){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array but got a :${objectType(path_definition[field])}`);
                        }
                        for (var i=0; i<path_definition[field].length; i++){
                            if (typeof path_definition[field][i] !== 'string'){
                                throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array of strings but got in position ${i} a :${objectType(path_definition[field][i])}`);
                            }    
                        }
                        break;
                    case 'security':
                        // if (!isObject(this.path_definition[field])){
                        //     throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an object but got a :${objectType(path_definition[field])}`);
                        // }
                        // if (Object.keys(path_definition.security).length !=0 && !(this.swaggerOptions && this.swaggerOptions.components && this.swaggerOptions.components.securitySchemes) ){
                        //     throw Error(`In path ${this.get_full_path()}, method ${method}: security referenced while the security schemes are not specified`);
                        // }
                        // for(var sec in path_definition.security){
                        //     if ( !(sec in this.swaggerOptions.components.securitySchemes) ){
                        //         return Error(`In path ${this.get_full_path()}, method ${method}: security "${sec}" referenced but not dlecared in the security schemes`)
                        //     }
                        // }
                        break;
                    case 'parameters':
                        if ( !(path_definition[field] instanceof Array) ){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an array but got a :${objectType(path_definition[field])}`);
                        }
                        for (var i=0; i<path_definition[field].length; i++){
                            path_definition[field][i] = new ParamsDefinitions(this.get_full_path(), method, this.swaggerOptions, this.swaggerServerConfig)
                                .fromParameters(path_definition[field][i], i, path_definition.consumes);
                        }
                        break;
                    case 'requestBody':
                        var requestBody = path_definition.requestBody;
                        if (!isObject(requestBody)){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects an object but got a :${objectType(requestBody)}`);
                        }
                        if ( !('content' in requestBody) ) {
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field}: a 'content' field is expected but not provided`);    
                        }
                        if (!isObject(requestBody.content)){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field}: the content is expected to be an object but got a :${objectType(requestBody.content)}`);
                        }

                        for (var ct in requestBody.content){
                            requestBody.content[ct] = new ParamsDefinitions(this.get_full_path(), method, this.swaggerOptions, this.swaggerServerConfig)
                                .fromRequestBody(requestBody.content[ct], ct, Object.keys(requestBody.content));
                        }
                        break;
                    case 'responses':
                        console.log('/!\\ WARNING : response field not yet analysed.');
                        break;
                    case 'handler':
                        if (typeof path_definition[field] !== 'string'){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}: field ${field} expects a string but got a :${objectType(path_definition[field])}`);
                        }
                        try{
                            var h_paths = path_definition.handler.split('#'), handler = this.swaggerServerConfig.load_module(h_paths[0]);
                        }
                        catch(e){
                            throw e;   
                        }

                        for(var i=1; i< h_paths.length; i++){
                            if (typeof handler === 'undefined'){
                                throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : handler path ${h_paths.map((e,i2)=> i2 <= i ? e: '').filter(e=> e!='').join('#')} is undefined`)
                            }
                            handler = handler[h_paths[i]];
                        }

                        if (typeof handler !== 'function' && !(handler instanceof Array)){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : a handler should reference a function or an array of functions but ${path_definition[field]} references a ${objectType(handler)}`);
                        }
                        else if (handler instanceof Error){
                            handler.forEach((h,i)=>{
                                if (typeof h !== 'function' ){
                                    throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : a handler should reference a function(s) but item at position ${i} is of type ${objectType(h)}`);
                                }
                            });
                        }
                        path_definition.handler = handler;
                        break;
                    case 'authorization_middleware':
                        var getMiddleware = (middleware_path)=>{
                            try{
                                var h_paths = middleware_path.split('#'), middleware = this.swaggerServerConfig.load_module(h_paths[0]);
                            }
                            catch(e){
                                throw e;   
                            }
    
                            for(var i=1; i < h_paths.length; i++){
                                if (typeof middleware === 'undefined'){
                                    throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : handler path ${h_paths.map((e,i2)=> i2 <= i ? e: '').filter(e=> e!='').join('#')} is undefined`)
                                }
                                middleware = middleware[h_paths[i]];
                            }
                            if (typeof middleware !== 'function' && !(middleware instanceof Array)){
                                throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : a handler should reference a function or an array of functions but ${path_definition[field]} references a ${objectType(middleware)}`);
                            }
                            else if (middleware instanceof Error){
                                middleware.forEach((m,i)=>{
                                    if (typeof m !== 'function' ){
                                        throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : a handler should reference a function(s) but item at position ${i} is of type ${objectType(m)}`);
                                    }
                                });
                            }
                            return middleware;
                        }

                        if (typeof path_definition[field] === 'string'){
                            path_definition.authorization_middleware = getMiddleware(path_definition.authorization_middleware);
                            continue;
                        }
                        else if (!isObject(path_definition[field])){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : expects either string (reference to a middleware) or an object (middleware+security scheme) but got ${objectType(param_definition[field])}`);
                        }
                        if (!'middleware' in path_definition[field]){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : field "middleware" is missing`);
                        }
                        if (!'security' in path_definition[field]){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : field "security" is missing`);
                        }
                        if (!isObject(path_definition[field].security)){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field} : field "security" must be an object`);
                        }
                        if (Object.keys(path_definition[field].security).length == 0){
                            throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field}, field "security" : no security defined (field "security" must not be empty)`);
                        }
                        for (var security in path_definition[field].security){
                            if ( this.swaggerOptions.components && this.swaggerOptions.components.securitySchemes && security in this.swaggerOptions.components.securitySchemes){
                                if (Object.keys( path_definition[field].security[security]).length != 0 &&
                                    JSON.stringify(this.swaggerOptions.components.securitySchemes[security]) != JSON.stringify(path_definition[field].security[security]) ){
                                    throw new Error(`In path ${this.get_full_path()}, method ${method}, field ${field}, field "security" : conflicting security definition, scheme ${defined} was already defined previously`)
                                }
                            }
                            else{
                                if (!this.swaggerOptions.components){
                                    this.swaggerOptions.components = {};
                                }
                                if (!this.swaggerOptions.components.securitySchemes){
                                    this.swaggerOptions.components.securitySchemes = {};
                                }
                                this.swaggerOptions.components.securitySchemes[security] = path_definition[field].security[security];
                                
                                
                            }
                            if (!path_definition.security){
                                path_definition.security = [];
                            }
                            var def = {};
                            def[security] = [];
                            path_definition.security.push(def);
                        }

                        path_definition.authorization_middleware = getMiddleware(path_definition.authorization_middleware.middleware);

                        break;
                    default:
                        console.log(`/!\\ WARNING : field "${field}" not recognized, is it a valid one?`);
                        break;
                }
            }
            this.path_config[method] = path_definition;
            
        }

        this.get_paths_and_middlewares();
        return this;
    }
    
    get_paths_and_middlewares() {

        this.paths = {};
        this.middlewares = {};

        

        for (var method in this.path_config) {
            var conf = this.path_config[method];
            
            this.paths[method] = JSON.parse(JSON.stringify(conf));
            this.middlewares[method] = [];

            

            if ('authorization_middleware' in conf){
                
                if (conf.authorization_middleware instanceof Array) {
                    this.path_config[method].authorization_middleware.forEach((h)=> { this.middlewares[method].push( h ); });
                }
                else{
                    this.middlewares[method].push( this.path_config[method].authorization_middleware );
                }
            }

            
            if ('parameters' in conf){
                this.paths[method].parameters = this.path_config[method].parameters.map(p => p.get_specification() );
                this.middlewares[method].push(this.path_config[method].parameters.map( p=> p.get_parse_middleware() ) );
            }

            if ('requestBody' in conf && "content" in conf.requestBody && Object.keys(conf.requestBody.content).length > 0){
                for (var ct in conf.requestBody.content){
                    this.paths[method].requestBody.content[ct] = this.path_config[method].requestBody.content[ct].get_specification();
                    this.middlewares[method].push(this.path_config[method].requestBody.content[ct].get_parse_middleware());
                }
            }

            if (conf.handler instanceof Array) {
                this.path_config[method].handler.forEach((h)=> { this.middlewares[method].push( h ); });
            }
            else{
                this.middlewares[method].push(this.path_config[method].handler);
            }
        }
    }
}

class ServerConfig{
    constructor(options){

        this.apply_defaults();

        if (typeof options !== 'undefined' && typeof options.API_METHODS !== 'undefined'){
            this.API_METHODS = this.validate('api_methods', options.API_METHODS);
        }
        if (typeof options !== 'undefined' && typeof options.SCHEMA_VALID_OPTIONS !== 'undefined'){
            this.SCHEMA_VALID_OPTIONS = this.validate('schema_valid_options', options.SCHEMA_VALID_OPTIONS);
        }
        if (typeof options !== 'undefined' && typeof options.HANDLER_MODULES_ROOT !== 'undefined'){
            this.HANDLER_MODULES_ROOT = this.validate('handler_modules_root', options.HANDLER_MODULES_ROOT);
        }
        if (typeof options !== 'undefined' && typeof options.CORS !== 'undefined'){
            this.CORS = this.validate('cors', options.CORS);
        }

        //console.log('this.HANDLER_MODULES_ROOT : ', this.HANDLER_MODULES_ROOT);
    }

    
    apply_defaults(){
        this.API_METHODS = ['get', 'post', 'put', 'delete', 'head'];
        
        
        this.SCHEMA_VALID_OPTIONS = {
            KNOWN: [
                'type', 'allOf', 'oneOf', 'anyOf', 'not', 'items', 'properties', 'additionalProperties', 'description', 'format', 'default',
                'title', 'multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum', 'maxLength', 'minLength', 'pattern', 'maxitems', 'minitems', 'uniqueitems', 'maxProperties', 'minProperties', 'required', 'enum', 'example'
            ],
            SUPPORTED: [
                'type', 'allOf', 'items', 'properties', 'description', 'format', 'default',
                'maximum', 'minimum', 'maxLength', 'minLength', 'pattern', 'maxitems', 'required', 'enum', 'example'
            ],
            FORMATS: {
                string : ['', 'byte', 'binary', 'date', 'date-time', 'password'],
                integer: ['int32', 'int64'],
                number: ['float', 'double'],
                boolean: ['']
            }
        }
        
        this.HANDLER_MODULES_ROOT = process.cwd();

        this.CORS = null;
    }

    load_module(m_path){
        
        var rgx = new RegExp('^.?/');

        if (m_path.startsWith('/')) { // ABSOLUTE PATH
            //
            return require(m_path);
        }
        else { // Relative path
            var r_path = m_path.replace(/^\.\//, '');

            var relative_to_handler_root = this.HANDLER_MODULES_ROOT.replace(/\/$/, '') + '/' + r_path;
            var relative_to_dirname = __dirname + '/' +r_path;
            var relative_to_working_dir = process.cwd() + '/' + r_path;

            // console.log("m_path: ", m_path);
            // console.log("r_path: ", r_path);
            // console.log("relative_to_handler_root: ", relative_to_handler_root);
            // console.log("relative_to_dirname: ", relative_to_dirname);
            // console.log("relative_to_working_dir: ", relative_to_working_dir);

            try{
                //console.log("Trying to load : ", relative_to_handler_root);
                return require(relative_to_handler_root);
            }
            catch(e){
                try{
                    //console.log("Trying to load : ", relative_to_dirname);
                    return require(relative_to_dirname);
                }
                catch(e) {
                    try{                
                        //console.log("Trying to load : ", relative_to_working_dir);
                        return require(relative_to_working_dir);
                    }
                    catch(e){
                        console.log(e);
                        throw new Error('could not load module '+m_path);
                    }
                } 
            }
        }
    }

    validate (type, spec){
        if (type === 'api_methods'){
            //
            return spec;
        }
        else if (type === 'schema_valid_options'){
            //
            return spec;
        }
        else if (type === 'handler_modules_root'){
            return spec;
        }
        else if (type === 'cors'){
            return spec;
        }
    }
}

class SwaggerRouter {

    constructor(routes_config, swaggerOptions, swaggerServerConfig){
        //
        if (typeof swaggerOptions === 'undefined'){
            throw new Error(`swaggerOptions missing`);
        }

        this.swaggerServerConfig = (typeof swaggerServerConfig === 'undefined')? new ServerConfig() : swaggerServerConfig;
        
        this.routes_config = routes_config;
        this.swaggerOptions = swaggerOptions;
        this.route_prefix = '';
        this.sub_routes = [];

        //this.setup();
    }

    set_server_config(swaggerServerConfig){
        this.swaggerServerConfig = swaggerServerConfig;
    }

    set_swaggerOptions(swaggerOptions){
        this.swaggerOptions = swaggerOptions;
        return this;
    }

    set_route_prefix(prefix){
        this.route_prefix = prefix.replace(/\/$/, '');
        return this;
    }
    
    url_to_express_format(url){
        var ids = url.match( new RegExp('{[^{}]*}', 'g') );
        if (!ids){
            return url;
        }
        var res = url;

        ids.forEach((id)=>{
            var exppress_id = id.substring(1, id.length-1);
            //console.log('id : ', id, 'express_id : ', exppress_id);
            res = res.replace(id, ':'+exppress_id);
        });

        return res;
    }

    setup (){
        
        for(var path in this.routes_config){
            //var path_name =  this.route_prefix + (path.startsWith("/")? '' : '/') + path.replace(/\/$/, '');
            if ( this.routes_config[path] instanceof SwaggerRouter ){
                var prefix = this.route_prefix + (path.startsWith("/")? '' : '/') + path.replace(/\/$/, '');
                this.routes_config[path].set_route_prefix(this.url_to_express_format(prefix));
                this.routes_config[path].set_server_config(this.swaggerServerConfig);
                this.routes_config[path].setup();
            }else{
                this.routes_config[path] = new SwaggerPath(path, this.route_prefix, this.routes_config[path], this.swaggerOptions, this.swaggerServerConfig); 
            }
        }

        this.paths = {}, this.express_router = express.Router();

        for (var p in this.routes_config){
            if ( this.routes_config[p] instanceof SwaggerRouter ){
                //
                
                var sub_paths = this.routes_config[p].paths;
                for (var p2 in sub_paths){
                    var fp = p+(p2.startsWith("/")? '' : '/') + p2.replace(/\/$/, '');
                    this.paths[fp] = sub_paths[p2];
                }

                this.express_router.use(this.url_to_express_format(p), this.routes_config[p].express_router);
            }
            else{
                this.paths[p] = this.routes_config[p].paths;

                var md = this.routes_config[p].middlewares;
                for (var method in md){
                    md[method].push((req, res, next)=>{ console.log("Cool everything is done beautifully, params : ", res.locals.params); });
                    // console.log("Method : ", method);
                    // console.log("p : ", p);
                    // console.log("md : ", md);
                    //console.log('p : ', p, 'this.url_to_express_format(p) : ', this.url_to_express_format(p));
                    this.express_router[method](this.url_to_express_format(p), md[method]);
                }
            }
        }
    }

    swagger() {
        if (typeof this.express_router === 'undefined'){
            this.setup();
        }
        var swaggerDoc = this.swaggerOptions; swaggerDoc.paths = this.paths;

        const bodyParser = require('body-parser'), app = express(), swaggerUi = require('swagger-ui-express');

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));

        console.log(" this.swaggerServerConfig.CORS  : ", this.swaggerServerConfig.CORS );
        if (this.swaggerServerConfig.CORS != null){
            // Apply global cors
            if (Object.keys(this.swaggerServerConfig.CORS).legnth == 0) {
                app.use(cors());
            }
            // Apply specific cors defintion
            else{
                app.use(cors(this.swaggerServerConfig.CORS));
            }
        }

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

        app.use('/', this.express_router);

        return app;
    }

}

exports.ServerConfig = ServerConfig;
exports.SwaggerRouter = SwaggerRouter;