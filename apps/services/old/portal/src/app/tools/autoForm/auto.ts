
import { Component, OnInit, Injectable, Type, Input, ComponentFactoryResolver, ElementRef } from '@angular/core';

class FormItem {
    constructor(public component: Type<any>, public format:any){}
    // ngOnInit(): void {
        
    // }
}


@Component({
    selector: 'form-input',
    template: `
        <div class="row">
            <label class="col-sm-2" for="toto"> {{name}} </label>
            <div class="col-sm">
                <input type="number" id={{name}}>
            </div>
        </div>
    `
})
export class FormInputComponent implements OnInit{
    @Input() name: string;

    ngOnInit(): void {
        
    }
}

@Component({
    selector: 'yo-form',
    template: ``
})
export class YoFormComponent implements OnInit{
    @Input() format: any;

    constructor(private el: ElementRef, private componentFactoryResolver: ComponentFactoryResolver){}

    ngOnInit(): void {
        console.log("Yo format : ", this.format);
        var ref = this.spawnNew();
    }
    spawnNew() {
        //
    }
    /*
    spawnChild(name){
        var child = new FormItem(FormInputComponent, name);
        child.instance.
    }
    spawnNew(){
        var name = this.format.name;
        var cmpt = 0;
        setInterval(()=>{
            name += '-'+(cmpt++);
            var inp = this.spawnChild(name);

        }, 5000);
    }
    */
}
