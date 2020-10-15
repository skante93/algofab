


const PRIMITIVE_TYPES = ["string", "integer", "number", "boolean" ] 

const isObject = (o) => {
    return typeof o !== "undefined" && o != null && o.constructor.prototype === ({}).constructor.prototype;
}
const isTypedObject = (o) => {
    return isObject(o) && 'type' in o && typeof o.type === 'string';
}

const isPrimitiveType = (o) => {
    return isTypedObject(o) && PRIMITIVE_TYPES.indexOf(o.type) >= 0;
}

const isMixedTypeObject = (o) => {
    return isObject(o) && 'type' in o && ['anyOf', 'oneOf', 'allOf'].map(e=> e in o).reduce((a,b)=>a||b);
}

const isOneKindOfMixedType = (o) =>{
    
    if (!isMixedTypeObject(o)){
        return false;
    }
    var tab = ['anyOf', 'allOf', 'allOf'].map(e=> e in o? e : null).filter(e=> e != null);
    return tab.length == 1 ? true : tab;
}

const isRefObject = (o) => {
    return isObject(o) && '$ref' in o && typeof o.type === 'string';
}

const isSchemaObject = (o)=>{
    return isTypedObject(o) || isRefObject(o);
}

class GenericValidator {
    //doc = null;
    //rootDoc = null;

    constructor(doc, rootDoc){
        if (typeof doc === 'undefined' || doc == null){
            throw new Error(`constructor parameter "doc" is required`);
        }
        else if (typeof doc === 'string'){
            if (PRIMITIVE_TYPES.indexOf(doc) < 0){
                throw new Error(`contructor parameter "doc" (as a string) must be primitive (${PRIMITIVE_TYPES.join(', ')}), thus "${doc}" is rejected`);
            }
        }
        else if ( !(isTypedObject(doc) || isMixedTypeObject(doc) || isSchemaObject(doc))){
            throw new Error(`constructor parameter "doc" is expected to be either a string or a TypedObject or a mixedTypeObject or at least a schema`);
        }

        this.doc = doc;
        
        if (typeof rootDoc !== 'undefined' && rootDoc != null){
            if ( rootDoc.constructor.prototype !== ({}).constructor.prototype ){
                throw new Error(`constructor parameter "rootDoc" is expected to be an object`);
            }
            this.rootDoc = rootDoc;
        }
        else{
            this.rootDoc = null;
        }

        this.isValidDocument();
        this.init();
    }

    setRootDoc(rootDoc){
        if (this.isValidDocument(rootDoc) === true ){
            this.rootDoc = rootDoc;
        }
    }

    lookup (reference) {
        if (this.rootDoc == null){
            throw new Error(`cannot lookup when no rootDoc was provided`);
        }

        let refParts = reference.replce(/^#\//, '').split('/'), pointed = this.rootDoc;
        for (let p of refParts){
            if ( !(p in pointed) ){
                throw new Error(`reference "${reference}" not found.`)
            }
            pointed = pointed[p];
        }

        return pointed;
    }

    isValidDocument (){ return true; }
}

class StringValidator extends GenericValidator {
    init() {
        console.log('String parser ...');
    }
    validateAgainst(spec) {}
    parse(spec){}
}

class NumberValidator extends GenericValidator {
    init() {
        console.log('Number parser ...');
    }
    validateAgainst(spec) {}
    parse(spec){}
}

class BooleanValidator extends GenericValidator {
    init() {
        console.log('Boolean parser ...');
    }
    validateAgainst(spec) {}
    parse(spec){}
}

class PrimitiveValidator extends GenericValidator {
    init(){
        console.log('Primitive parser ...');
        if (typeof this.doc === 'string'){
            switch (this.doc){
                case 'string':
                    this.parser = new StringValidator({type: doc}, this.rootDoc);
                    break;
                case 'integer':
                    this.parser = new NumberValidator({type: doc}, this.rootDoc);
                    break;
                case 'number':
                    this.parser = new NumberValidator({type: doc}, this.rootDoc);
                    break;
                case 'boolean':
                    this.parser = new BooleanValidator({type: doc}, this.rootDoc);
                    break;
                default: 
                    throw new Error(`primitive doc "${doc}" is not a primitve type (correct types are : ${PRIMITIVE_TYPES.join(', ')})`);
            }
        }
        else{
            switch (this.doc.type){
                case 'string':
                    this.parser = new StringValidator({type: doc}, this.rootDoc);
                    break;
                case 'integer':
                    this.parser = new NumberValidator({type: doc}, this.rootDoc);
                    break;
                case 'number':
                    this.parser = new NumberValidator({type: doc}, this.rootDoc);
                    break;
                case 'boolean':
                    this.parser = new BooleanValidator({type: doc}, this.rootDoc);
                    break;
                default: 
                    throw new Error(`primitive doc "${doc}" is not a primitve type (correct types are : ${PRIMITIVE_TYPES.join(', ')})`);
            }
        }
    }
}

class SchemaValidator extends GenericValidator {
    init(){
        if ( !isSchemaObject(this.doc) ){
            throw new Error(`schema object must either ba TypeObject or a RefObject`);
        }

        if (isRefObject(this.doc)){
            var schema = this.lookup( this.doc.$ref );
            if (typeof schema === 'string' || isPrimitiveType(schema)){
                this.parser = new PrimitiveValidator(schema, this.rootDoc);
            }
            else if (isMixedTypeObject(schema)){
                this.parser = new MixedTypeValidator(schema, this.rootDoc);
            }
            else if(!isSchemaObject(schema)){
                throw new Error(`schema ref "${this.doc.$ref}" is not a primitive type nor a mixedType nor a schema Type`);
            }
            else {
                this.parser = new SchemaValidator(schema, this.rootDoc);
            }
        }
        else{
            if (typeof this.doc === 'string' || isPrimitiveType(this.doc)){
                this.parser = new PrimitiveValidator(this.doc, this.rootDoc);
            }
            else if (isMixedTypeObject(this.doc)){
                this.parser = new MixedTypeValidator(this.doc, this.rootDoc);
            }
            else if(isSchemaObject(this.doc)){
                if( ["object", "array"].indexOf(this.doc.type) < 0){
                    throw new Error(`schema type is neither a primitive type nor "object" nor "array"`)
                }

                this.parser = {};

                if (this.doc.type == 'object'){
                    this.parser = {};
                    if ('properties' in this.doc){
                        if (!isObject(this.doc.properties)){
                            throw new Error(`object field "properties" is expected to be an object`);
                        }
                        for (var p in this.doc.properties){
                            if (typeof this.doc.properties[p] === 'string' || isPrimitiveType(this.doc.properties[p])){
                                this.parser[p] = new PrimitiveValidator(this.doc.properties[p], this.rootDoc);
                            }
                            else if (isMixedTypeObject(this.doc.properties[p])){
                                this.parser[p] = new MixedTypeValidator(this.doc.properties[p], this.rootDoc);
                            }
                            else if(isSchemaObject(this.doc.properties[p])){
                                this.parser[p] = new SchemaValidator(this.doc.properties[p], this.rootDoc);
                            }
                            else {
                                throw new Error(`object property "${p}" is not a primitive type nor a mixedType nor a schema Type`);
                            }
                        }
                    }
                }
                else{
                    if ('items' in this.doc){
                        if (typeof this.doc.items === 'string' || isPrimitiveType(this.doc.items)){
                            this.parser = new PrimitiveValidator(this.doc.items, this.rootDoc);
                        }
                        else if (isMixedTypeObject(this.doc.items)){
                            this.parser = new MixedTypeValidator(this.doc.items, this.rootDoc);
                        }
                        else if(isSchemaObject(this.doc.properties[p])){
                            this.parser = new SchemaValidator(this.doc.items, this.rootDoc);
                        }
                        else {
                            throw new Error(`array items "${p}" is not a primitive type nor a mixedType nor a schema Type`);
                        }
                    }
                }
            }
            else { 
                throw new Error(`schema ref "${this.doc.$ref}" is not a primitive type nor a mixedType nor a schema Type`);
            }
        }
    }
}

class MixedTypeValidator extends GenericValidator {
    init(){
        var mix = isOneKindOfMixedType(this.doc);
        if( mix !== true ){
            throw new Error(`mixedTypeObject cannot have both "${mix[0]}" and "${mix[1]}"`);
        }
        this.mix = ('allOf' in this.doc)? 'allOf' : ('anyOf' in this.doc) ? 'anyOf' : 'oneOf';

        if ( !this.doc[this.mix] instanceof Array ){
            throw new Error(`mixedTypes expect an array as values`);
        }

        this.parser = {};
        this.parser[mix] = this.doc[this.mix].map((e,i)=>{
            if (typeof e === 'string' || isPrimitiveType(e)){
                return new PrimitiveValidator(e, this.rootDoc);
            }
            else if (isMixedTypeObject(e)){
                return new MixedTypeValidator(e, this.rootDoc);
            }
            else if (isSchemaObject(e)){
                //
            }
            else if(){
                //
            }
            else{
                throw new Error(`mixedType "${this.mix}", item at position ${i} is not a string, nor a primitive, nor a mixedType, nor a schema`);
            }
        });
    }
}
/*
const SIMPLE_TYPES = {
    
    string: {
        class: StringValidator,
        options: {
            minLength: Number,
            maxLength: Number,
            pattern: RegExp,
            default: String,
            required: Boolean,
        },
        formats: ["date", "password", "duration", "binary"]
    },

    integer: {
        class: NumberValidator,
        options: {
            minimum: Number,
            maximum: Number,
            required: Boolean
        },
        formats: ['int32', 'int64']
    },
    
    number: {
        class: NumberValidator,
        options: {
            minimum: Number,
            maximum: Number,
            required: Boolean
        },
        formats: ['float', 'double']
    },

    boolean: {
        class: BooleanValidator,
        options: {
            required: Boolean
        },
        formats: []
    }
}
*/


class Validator extends GenericValidator{

    parseIfMixedType (doc) {
        if ( !('anyOf' in doc || 'oneOf' in doc || 'allOf' in doc) ){
            return null;
        }

        if ('anyOf' in doc && 'oneOf' in doc){
            throw new Error(`both "anyOf" and "oneOf" specified, only one should be`);
        }
        else if('anyOf' in doc && 'allOf' in doc){
            throw new Error(`both "anyOf" and "allOf" specified, only one should be`);
        }
        else if('oneOf' in doc && 'allOf' in doc){
            throw new Error(`both "oneOf" and "allOf" specified, only one should be`);
        }
        
        let mix = ('anyOf' in doc)? 'anyOf' : ('oneOf' in doc)? 'oneOf' : 'allOf' ;
        
        if ( !(doc[mix] instanceof Array) ) {
            throw new Error(`field "${mix}" is expected to be an array`);
        }

        let parser = {}; parser[mix] = doc[mix].filter(d=> typeof d !== 'undefined' && d != null ).map( d => {
            if (typeof d === 'string'){
                return new PrimitiveValidator({type: d, required: true}, this.rootDoc);
            }

            if ( !isTypedObject(d) ){
                throw new Error(`field "${mix}" is expected to be an array of TypedObjects`);
            }

            d.required = true;
            
            return new Validator(d, this.rootDoc); 
        });

        return parser
    }

    parseIfCompositeType(doc){
        /**/
    }

    parseIfSchema(doc) {
        if ( !('schema' in doc) ){
            return null;
        }
        
        if (typeof doc.schema === 'undefined' || doc.schema == null){
            throw new Error(`schema is undefined`);
        }

        if ( !(typeof doc.schema === 'string' || isTypedObject(doc.schema) || isRefObject(doc.schema)) ){
            throw new Error(`schema should either be a string (primitive type) or a TypedObject or a RefObject`);
        }

        if (typeof doc.schema === 'string'){
            return new PrimitiveValidator(doc.schema, this.rootDoc);
        }
        else if ('$ref' in schema){
            return new Validator( this.lookup(doc.schema.$ref), this.rootDoc );
        }

        return new Validator(doc.schema, this.rootDoc);
    }

    parseIfPrimitiveType(doc) {
        if ( !(isTypedObject(doc) && PRIMITIVE_TYPES.indexOf(doc.type) >= 0) ){
            return null;
        }
        
        return new PrimitiveValidator(doc, this.rootDoc);
    }
    
    init(){
        this.parser = this.parseIfMixedType(this.doc);
        
        if (this.parser != null) { return; }
        
        this.parser = this.parseIfCompositeType(this.doc);

        if (this.parser != null) { return; }
    
        this.parser = this.parseIfSchemaType(this.doc);

        if (this.parser != null) { return; }
    
        this.parser = this.parseIfSimpleType(this.doc);

        if (this.parser != null) { return; }
    
    }
}


