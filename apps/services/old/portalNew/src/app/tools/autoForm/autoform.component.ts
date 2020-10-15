

import { Component, OnInit, Input, Directive, ElementRef, ViewChild } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { FormsModule } from '@angular/forms';
import { HashLocationStrategy } from '@angular/common';

var $ = window['$'];


interface FormField {
    name: string,
    type: 'string' | 'number' | 'boolean' | 'select' | 'array',
    hideName?: boolean,
    items?: FormField[] | 'number' | 'string' | 'boolean',
    options?: {
        isPassword?: boolean,
        required?: boolean,
        min?: number,
        max?: number,
        pattern?: string,
        enum?: Array<number> | Array<string> | Array<boolean>
    }
}
/*
@Component({
    selector: 'form-input',

})
export class NumberInputDirective{

    @Input() name;
    @Input() hideName: boolean = false;
    @Input() min: number;
    @Input() max: number;
    @Input() required: boolean;

    constructor(private ref: ElementRef){}

    ngOnInit(){
        var name = $(`<label class="col-sm-2" for="${this.name}">${this.name}</label>`);
        var input = $(`<input type="number" class="form-control" 
                            id="${this.name}" name="${this.name}" 
                            ${this.min != undefined? `min="${this.min}"`:''} 
                            ${this.max != undefined? `max="${this.max}"`:''} 
                            ${this.required != undefined ? 'required': ''}>`);
        
        input.change((event)=>{
            console.log("STRING ", this.name, " Changed : ", event.target);
        });

        var row = $(`<div class="row"></div>`);
        if (this.hideName !== true){
            row.append(name);
        }
        
        row.append( $('<div class="col-sm"></div>').append(input));

        $(this.ref.nativeElement).append(row);
    }
}

@Directive({
    selector: '[myFormField]'
})
export class FormFieldDirective {

    @Input() format: any;
    children: ElementRef[];

    constructor(private ref: ElementRef) {}

    ngOnInit(){
        this.format = JSON.parse(this.format);
        this.build();
    }

    createSelect(spec){
        var name_section = $(`<label class="col-sm-2" for="${spec.name}">${spec.name}</label>`);
        var input_section = $('<div class="col-sm"></div>');

        var name = spec.name,
            required = spec.options && spec.options.required === true? 'required': '',
            select = $(`
                <select class="form-control" id="${name}" name="${name}" ${required}>
                    ${ spec.items.map((e)=> `<option value="${e}">${e}</options`).join() }
                </select>
            `);

        select.change((event)=>{
            console.log("SELECT ", spec.name, " Changed : ", event.target);
        });
        input_section.append(select);

        var row = $(`<div class="row"></div>`);
        if (spec.hideName !== true){
            row.append(name_section);
        }
        
        row.append(input_section);
        return row;
    }

    createString(spec){
        var name_section = $(`<label class="col-sm-2" for="${spec.name}">${spec.name}</label>`);
        var input_section = $('<div class="col-sm"></div>');

        var name = spec.name,
                required = spec.options && spec.options.required === true? 'required': '',
                type = spec.options && spec.options.isPassword === true? 'type="password"' : 'type="text"',
                pattern = spec.options && spec.options.pattern ? `pattern=${spec.options.pattern}` : '',
                input = $(`<input class="form-control" id="${name}" name="${name}" ${type} ${pattern} ${required}>`);
            
        input.change((event)=>{
            console.log("STRING ", spec.name, " Changed : ", event.target);
        });
        input_section.append(input);

        var row = $(`<div class="row"></div>`);
        if (spec.hideName !== true){
            row.append(name_section);
        }
        
        row.append(input_section);
        return row;
    }

    createNumber(spec){

        var name_section = $(`<label class="col-sm-2" for="${spec.name}">${spec.name}</label>`);
        var input_section = $('<div class="col-sm"></div>');

        var name = spec.name,
            required = spec.options && spec.options.required === true? 'required': '',
            min = spec.options && 'min' in spec.options? `min="${spec.options.min}"` : '',
            max = spec.options && 'max' in spec.options? `max="${spec.options.max}"` : '',
            input = $(`<input class="form-control" id="${name}" name="${name}" type="number" ${min} ${max} ${required}>`);
            
        input.change((event)=>{
            console.log("STRING ", spec.name, " Changed : ", event.target);
        });
        input_section.append(input);

        var row = $(`<div class="row"></div>`);
        if (spec.hideName !== true){
            row.append(name_section);
        }
        
        row.append(input_section);
        return row;
    }

    createBoolean(spec) {
        var name_section = $(`<label class="col-sm-2" for="${spec.name}">${spec.name}</label>`);
        var input_section = $('<div class="col-sm"></div>');

        var name = spec.name,
            required = spec.options && spec.options.required === true? 'required': '',
            checkbox = $(`<input class="form-control" id="${name}" name="${name}" type="checkbox" ${required}>`);
        
        checkbox.change((event)=>{
            console.log("CHECKBOX ", spec.name, " Changed : ", event.target);
        });
        input_section.append($('<div class="form-switch"></div>').append(checkbox).append( $('<div class="slider"><div class="state"></div></div>') ));

        var row = $(`<div class="row"></div>`);
        if (spec.hideName !== true){
            row.append(name_section);
        }
        
        row.append(input_section);
        return row;
    }
    
    build(){

        if (this.format.type == 'select'){
            $(this.ref.nativeElement).append(this.createSelect(this.format));
        }
        else if (this.format.type == 'string'){
            $(this.ref.nativeElement).append(this.createString(this.format));
        }
        else if (this.format.type == 'number'){
            $(this.ref.nativeElement).append(this.createNumber(this.format));
        }
        else if (this.format.type == 'boolean'){
            $(this.ref.nativeElement).append(this.createBoolean(this.format));
        }
        else{
            //
            var items = $(`<div class="row"></div>`);

            var addItem = $(`<button type="button" class="btn btn-secondary"> Add item </button>`);
            
            addItem.click(()=>{
                if (this.format.items === 'string' || this.format.items === 'number' || this.format.items === 'boolean'){
                    //

                    var item = this.format.items === 'string' ? 
                        this.createString({name: this.format.name+'$', type:"string", hideName: true}) :
                            this.format.items === 'number' ? this.createNumber({name: this.format.name+'$', type:"number", hideName: true}): 
                            this.createBoolean({name: this.format.name+'$', type:"boolean", hideName: true});
                    var removeBtn = $(`<div class="btn btn-danger"> Remove Item </div>`);
                    var item_container = $('<div class="row"></div>')
                        .append( $('<div class="col-sm"></div>').append(item) )
                        .append( $('<div class="col-sm"></div>').append(removeBtn) );
                    
                    removeBtn.click(()=>{
                        item_container.remove();
                    });
                }
                else{
                    //
                    for(var i=0; i<this.format.items.length; i++){
                        
                    }
                }
            });
        }

    }
}
*/

@Component({
    selector: 'tools-auto-form',
    templateUrl: './autoform.component.html',
    styleUrls: [ './autoform.component.scss' ]
})
export class AutoFormComponent implements OnInit {
    
    @Input() fields : FormField[] = [
        { name: "username", type : "string", options: { required: true, pattern: "^[a-z][a-z0-9]{2,}$" } },
        { name: "accept", type: "boolean" },
        { name: "age", type: "number", options: { min: 18, max: 60} },
        { name: "books", type: "array", items: [{ name: "book_name", type:"string"}, {name:"delivered", type: "boolean"}]}
    ];
    exple_f:any = this.fields[0];
    model: any;
    formSwitchClickInterval: number;

    constructor() {}

    ngOnInit(): void {

        var interv = setInterval(()=>{
            if (!this.fields) {
                return
            }

            clearInterval(interv);

            // console.log("autoform fields: ", this.fields);
            // console.log("autoform model: ", this.model);
        });
    }
    
    stringify(o){ return JSON.stringify(o); }
    
    isFormField(field: any): field is FormField {
        return typeof field === 'object' && 'name' in field && 'type' in field;
    }

    setFields (fields: FormField[]): void {
        this.fields = fields;
    }

    fieldRedered(){
        console.log("Field rendered !!!!!!");
    }

    modelValueChanged(path, index, event){

        console.log("modelValueChanged [", path, "] (index : ", index,"): ", event.target);
        var path_segments = path.split('.'), path_format= this.fields, model = this.model;
        path_segments.forEach( (seg)=>{
            
            console.log("seg : ", seg);
            if (/\[[0-9]+\]$/.test(seg)){ // aray type of var name =
                var name = seg.replace(/\[[0-9]+\]$/, ''); 
                var ind = seg.replace(name,''); ind = parseInt(ind.substring(1,ind.length-1));

                console.log("name : ", name, " | index : ", index, " | ind : ", ind);
                if ( !(name in model)){
                    model[name] = [];
                }
                while (model[name].length < ind){
                    model[name].push(null);
                }
                model[name][ind] = event.target; 
            }
            else{

            }
            
        });
    }

    addItemToArrayType(path, index, children) {
        console.log("add item to array type : path ", path, " | children : ", children);
        children.push(children.length);
    }

    removeItemFromArrayType(path, index, i, children) {
        console.log("add item to array type : path ", path, " | children : ", children);

        children.splice(i, 1);
    }

    ngAfterViewInit(){
        //console.log("[autoform] : after init view : ", $('#form-switch') );

        this.formSwitchClickInterval = setInterval(()=>{
            $('.form-switch').each((i,e)=>{
                //console.log('form switches [',i,']: ', e);
                //console.log('events [',i,']: ', $._data(e, "events"));
                var ev = $._data(e, "events");
                if (ev && 'click' in ev){
                    return;
                }
                $(e).click(()=>{});
                
                $(window).click((event)=>{
                    if (event.target == e || e.contains(event.target)){
                        var checkbox = $(e).find('input[type="checkbox"]');
                        //console.log("checkbox [ name : ", checkbox.attr('name'), "]: ", checkbox);
                        checkbox.prop('checked', !checkbox.prop('checked') );
                        //this.model[ checkbox.attr('name') ] = !this.model[ checkbox.attr('name') ]; 
                    }
                });
            });
        }, 1000);
    }

    ngOnDestroy() {
        clearInterval(this.formSwitchClickInterval);
    } 
    
    

    onSubmit(form) {
        console.log('Auto From submitted!!');
        console.log('Values : ', form.value);
    }
}
