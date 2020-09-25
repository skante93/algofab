import { NgModule } from "@angular/core";



import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';


import { NavItemComponent, NavComponent } from './nav/nav.component'
import { ListComponent } from './list/list.component';
//import { FormFieldDirective, AutoFormComponent } from './autoForm/autoform.component';
import { AutoFormComponent } from './autoForm/autoform.component';
import { FormInputComponent, YoFormComponent } from './autoForm/auto';

//import { MainService } from './services/main';

@NgModule({
    declarations: [
        NavItemComponent,
        NavComponent,
        ListComponent,
        AutoFormComponent,
        FormInputComponent,
        YoFormComponent
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
        AutoFormComponent,
        //FormFieldDirective
    ]
})
export class ToolsModule {}