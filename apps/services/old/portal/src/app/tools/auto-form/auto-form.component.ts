import { Component, ElementRef, Input, OnInit, Type, ViewChild } from '@angular/core';

import {FormInputComponent, FormInputFormat, typeofFromInput} from './interfaces';
import { formatCurrency } from '@angular/common';

const $ = window['$'];

function flattenArray(obj: Array<any>): Array<any>{
  var o = [];
  obj.forEach( e=> {
    if (e instanceof Array){
      flattenArray(e).forEach( e2 => o.push(e2) );
    }
    else{
      o.push(e);
    }
  });
  return o;
}

function segmentPath (path: string): Array<string> {
  return flattenArray(path.split('.').map(e => {
    if (/(\[[^\[\]]+\])+$/.test(e) ){
      var name = e.replace(/(\[[^\[\]]+\])+$/, ''), indexes = e.match(/\[[^\[\]]+\]/g);
      var arr = name != '' ? [name] : [];
      indexes.forEach(i => arr.push(i));
      return arr;
    }
    else{
      return e;
    }
  }));
}

class AutoForm {
  public el: any;
  public formGroup: any;

  private arrayItems: Array<AutoForm> = null;
  private objectFields: any = null;

  constructor(public format: any){
    //if ()
    this.build();
  }

  numberTemplate(){
    this.el = $(`
      <input type="number" class="form-control" 
          name="${this.format.name}"  
          id="${this.format.name}" 
          ${"min" in this.format? `min="${this.format.min}"`: ''}
          ${"max" in this.format? `max="${this.format.max}"`: ''}
          ${this.format.required === true? 'required' : ''}>
    `);

    this.el.change(()=>{
      console.log("Number Input changed!!");
    });

    this.formGroup = $(`<div class="form-group row"></div>`).append(
      this.format.hide_name === true ? $('<!-- Label Hidden -->') : $(`<label class="col-sm-2" for="${this.format.name}">${this.format.name}</label>`)
    ).append( $(`<div class="col-sm"></div>`).append(this.el) );
  }

  stringTemplate() {
    if ('enum' in this.format){
      this.el = $(`
        <select class="form-control"
          name="${this.format.name}"  
          id="${this.format.name}" >

          ${ this.format.enum.map( e => `<option value="${e}">${e}</option>` ).join() }

        </select>
      `);
    }
    else{
      this.el = $(`
        <input class="form-control" type="${"format" in this.format ? this.format.format : "text"}"
          name="${this.format.name}"  
          id="${this.format.name}" 
          ${"pattern" in this.format? `pattern="${this.format.pattern}"`: ''}
          ${this.format.required === true? 'required' : ''}>
      `);
    }

    this.el.change(()=>{
      console.log("String Input changed!!");
    });

    this.formGroup = $(`<div class="form-group row"></div>`).append(
      this.format.hide_name === true ? $('<!-- Label Hidden -->') : $(`<label class="col-sm-2" for="${this.format.name}">${this.format.name}</label>`)
    ).append( $(`<div class="col-sm"></div>`).append(this.el) );

  }

  booleanTemplate(){
    this.el = $(`
      <input type="checkbox" 
          name="${this.format.name}"  
          id="${this.format.name}" 
          ${this.format.required === true? 'required' : ''}>
    `);

    var slider = $('<div class="slider"><div class="state"></div></div>');
    slider.click(()=>{
      this.el.click();
    });

    this.el.click(()=>{
      console.log("Boolean Input changed!!");
    });
    
    this.formGroup = $(`<div class="form-group row"></div>`).append(
      this.format.hide_name === true ? $('<!-- Label Hidden -->') : $(`<label class="col-sm-2" for="${this.format.name}">${this.format.name}</label>`)
    ).append( 
      $(`<div class="col-sm"></div>`).append( $('<div class="form-switch"></div>').append(this.el).append(slider) ) 
    );
  }

  arrayTemplate (){
    var right = $(`
      <div class="col-sm">
        <div class="array-items">
        </div>
      </div>
    `);
    
    var addItemBtn = $(`<button type="button" class="btn btn-secondary">Add Item</button>`);
    
    addItemBtn.click(()=>{
      this.format.items.hide_name = true;
      var newItem = new AutoForm(this.format.items);
      this.arrayItems.push( newItem );

      var removeItemBtn = $(`<button type="button" class="btn btn-danger">Remove Item</button>`);
      removeItemBtn.click(()=>{
        row.remove();
        this.arrayItems.splice(this.arrayItems.indexOf(newItem), 1);
      });

      var row = $('<div class="row"></div>').append(
        $(`<div class="col-sm"></div>`).append(newItem.formGroup)
      ).append(
        $(`<div class="col-sm-2"></div>`).append(removeItemBtn)
      );
      
      right.find('.array-items').append(row);
    });

    right.append( $(`<div class="row"><div>`).append( $('<div class="col-sm-2"></div>').append(addItemBtn)) );
    this.formGroup = $(`<div class="row"></div>`).append(
      this.format.hide_name === true ? $('<!-- Label Hidden -->') : $(`<label class="col-sm-2" for="${this.format.name}">${this.format.name}</label>`)
    ).append(right);
  }

  objectTemplate () {
    var right = $(`
      <div class="col-sm">
        <div class="object-items">
        </div>
      </div>
    `);
    for (var f in this.format.properties) {
      var newItem = new AutoForm(this.format.properties[f]);
      console.log("newItem: ", newItem.formGroup);
      right.find('.object-items').append(newItem.formGroup);
      this.objectFields[f] = newItem;
    }

    this.formGroup = $(`<div class="row"></div>`).append(
      this.format.hide_name === true ? $('<!-- Label Hidden -->') : $(`<label class="col-sm-2" for="${this.format.name}">${this.format.name}</label>`)
    ).append(right);    
  }

  appendTo (element) {
    this.formGroup.appendTo( $(element) );
  }

  isValid(): boolean {
    if (this.format.type === 'array'){
      return this.arrayItems.map( e=> e.isValid() ).reduce((a,b)=> a&&b);
    }
    else if (this.format.type === 'object'){
      return Object.values(this.objectFields).map( e=> (<AutoForm>e).isValid() ).reduce((a,b)=> a&&b);
    }
    else if(this.format.type === 'string') {
      //
    } 
    else if(this.format.type === 'boolean') {
      //
    } 
    else if(this.format.type === 'number') {
      //
    } 
    return false;
  }

  build() {
    if (this.format.type === "array"){
      console.log("### building array tepmplate ....");
      this.arrayItems = [];
      this.arrayTemplate();
    }
    else if(this.format.type === "object") {
      console.log("### building object tepmplate ....");
      this.objectFields = {};
      this.objectTemplate();
    }
    else if(this.format.type === "number"){
      console.log("### building number tepmplate ....");
      this.numberTemplate();
    }
    else if (this.format.type === "boolean"){
      console.log("### building boolean tepmplate ....");
      this.booleanTemplate();
    }
    else if (this.format.type === "string"){
      console.log("### building boolean tepmplate ....");
      this.stringTemplate();
    }
  }
}

@Component({
  selector: 'number-input',
  template: `
    <div class="form-group row">
      <!-- #### NUMBER INPUT #### -->
      <label *ngIf="hide_name !== true" class="col-sm-2" for="{{name}}">{{name}}</label>
      <div class="col-sm">
        <input type="number" class="form-control" 
          name="{{name}}"  
          id="{{name}}" 
          min="{{min != undefined ? min : null}}"
          max="{{max != undefined ? max : null}}"
          required="{{required === true ? true: null}}">
      </div>
    </div>
  `
})
export class NumberInputComponent implements FormInputComponent{
  // FROM PARENT COMPONENT
  @Input() path: string;
  @Input() rootModel: any;

  @Input() name: string;
  @Input() hide_name: boolean = false;
  @Input() min: number;
  @Input() max: number;
  @Input() required: boolean = false;
  
  constructor(private el: ElementRef){}

  ngOnInit(): void {
    console.log("Form Input component started");
    console.log("path : ", this.path);
    console.log("rootModel : ", this.rootModel);

    //getPath(this.path, this.rootModel, true);
    
  }
  
}

@Component({
  selector: 'tools-auto-form',
  templateUrl: './auto-form.component.html',
  styleUrls: ['./auto-form.component.scss']
})
export class AutoFormComponent implements OnInit {
  @ViewChild('autoFormRoot', {static:false}) autoFormRoot: ElementRef;
  
  // @Input() fields  = {
  //   type: "array",
  //   name: "sorry",
  //   items: {
  //     name: "age",
  //     type: "number",
  //     min: 18,
  //     max: 90,
  //     required: true
  //   }
  // };
  
  @Input() fields  = {
    type: "object",
    name: "sub", 
    properties: {
      a_string: {
        type: "string",
        name: "a_name",
        maxLength: 10,
        minLength: 2,
        pattern: "^a\.*z$",
        format: "password"
        //enum: ["abc", "def"]
      },
      an_array: {
        type: "array",
        name: "an_array",
        items: {
          name: "age",
          type: "number",
          min: 18,
          max: 90,
          required: true
        }
      }
    }
  }

  // @Input() fields  = {
  //   type: "boolean",
  //   name: "is_home",
  // };

  model: any;

  vals: any;

  

  constructor() { }

  ngOnInit(): void {
    //this.model = (this.fields instanceof Array)? [] : {};

    setInterval(()=>{ console.log("this model : ", this.model) }, 5000);
  }
  ngAfterViewInit(){
    console.log("content is : ", this.autoFormRoot.nativeElement);
    this.vals = new AutoForm(this.fields);

    console.log('this.vals.formGroup : ', this.vals.formGroup);
    $(this.autoFormRoot.nativeElement).append(this.vals.formGroup);

  }
  onReady(path:string, format:any){
    //
    var paths = segmentPath(path), r = this.model;
    for (var i=0; i<paths.length-1; i++){
      if (/\[[^\[\]]+\]/.test(paths[i])){
        var index = parseInt( paths[i].substring(1, paths[i].length-1) );
        r = r[index]; 
      }
      else if (paths[i] != ""){
        r = r[paths[i]];
      }
    }


  }
  typeofFromInput(input: any): string {
    return typeofFromInput(input);
  }

  onSubmit(form, event){
    console.log("On submit : ", event.target);
    console.log("this.vals.isValid() : ", this.vals.isValid());
    console.log("On submit : ", form.value);
  }
}
