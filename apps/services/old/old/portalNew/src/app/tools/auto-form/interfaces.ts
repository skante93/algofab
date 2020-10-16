


export interface FormInputComponent {
    path: string,
    rootModel: any,
    ngOnInit(): void,
}


interface StringInputFormat {
    name: string,
    type: "string",
    required?: boolean,
    maxLength?: number,
    minLength?: number,
    enum?: Array<string>,
    pattern?: string
}

interface NumberInputFormat {
    name: string,
    type: "number",
    required?: boolean,
    min?: number,
    max?: number
}

interface ObjectInputFormat {
    type: "object",
    properties: {
        [key: string]: StringInputFormat | NumberInputFormat
    }
}

export type FormInputFormat = StringInputFormat | NumberInputFormat | ObjectInputFormat;

let availableUnitTypes: Array<string> = ["string", "number"];

export let typeofFromInput: (input: any)=> string = (input)=> {
    if (input instanceof Array){
        input.forEach((e, i)=>{
            if ( !("type" in e) ){
                throw new Error(`input[${i}] "${JSON.stringify(e, null, 2)}" does not have any "type" field`);
            }
            if (availableUnitTypes.indexOf(e.type) < 0){
                throw new Error(`input[${i}] "${JSON.stringify(e, null, 2)}", type "${e.type}" is not valid`);
            }
        });
        return 'array';
    }
    else{
        if ( !("type" in input) ){
            throw new Error(`input "${JSON.stringify(input, null, 2)}" does not have any "type" field`);
        }
        if (input.type == "object"){
            if ( !("properties" in input) ){
                throw new Error(`input "${JSON.stringify(input, null, 2)}" requires a "properties" field`);
            }
            
            if ( input.properties.constructor.prototype !== ({}).constructor.prototype ) {
                throw new Error(`input "${JSON.stringify(input, null, 2)}", field "properties" must be an object`);
            }

            if ( Object.keys(input.properties).length == 0 ) {
                throw new Error(`input "${JSON.stringify(input, null, 2)}", field "properties" cannot be empty`);
            }
            return 'object';
        }else{
            if (availableUnitTypes.indexOf(input.type) < 0){
                throw new Error(`input "${JSON.stringify(input, null, 2)}", type "${input.type}" is not valid`);
            }
            return input.type;
        }
    }
}
