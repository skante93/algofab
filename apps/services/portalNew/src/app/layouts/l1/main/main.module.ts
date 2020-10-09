import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';

import { StoreModule } from './store/store.module';
import { WorkshopModule } from './workshop/workshop.module';
import { OthersModule } from './others/others.module';

import { ToolsModule } from '../../../tools/tools.module';
import { NotFoundComponent } from './others/not-found/not-found.component';
import { ReactiveFormsModule } from '@angular/forms';

const routes : Route[] = [
    // { 
    //     path: "", 
    //     pathMatch: "full" 
    // },
    { path: "**", component: NotFoundComponent }
];



@NgModule({
    imports : [
        //ToolsModule,
        StoreModule,
        WorkshopModule,
        OthersModule,
        //ReactiveFormsModule,
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule]
})
export class MainL1Module {}