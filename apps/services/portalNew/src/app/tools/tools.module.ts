import { NgModule } from "@angular/core";



import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';


import { NavItemComponent, NavComponent } from './nav/nav.component'
import { ListComponent } from './list/list.component';
//import { FormFieldDirective, AutoFormComponent } from './autoForm/autoform.component';
//import { AutoFormComponent } from './autoForm/autoform.component';

import { NumberInputComponent, AutoFormComponent } from './auto-form/auto-form.component';

//import { FormInputComponent, YoFormComponent } from './autoForm/auto';

//import { MainService } from './services/main';

import { CaptchaComponent } from './captcha/captcha.component';
import { RatingsDirective } from "./ratings/ratings.directive";

@NgModule({
    declarations: [
        NavItemComponent,
        NavComponent,
        ListComponent,
        NumberInputComponent,
        AutoFormComponent,
        CaptchaComponent,
        RatingsDirective
        // FormInputComponent,
        // YoFormComponent,        
        //FormFieldDirective
    ],
    // providers :[
    //     MainService
    // ],
    imports: [
        CommonModule,
        BrowserModule,
        FormsModule,
        RouterModule
    ],
    exports: [
        //MainService,
        NavItemComponent,
        NavComponent,
        ListComponent,
        NumberInputComponent,
        AutoFormComponent,
        CaptchaComponent,
        RatingsDirective
        //FormFieldDirective
    ]
})
export class ToolsModule {}