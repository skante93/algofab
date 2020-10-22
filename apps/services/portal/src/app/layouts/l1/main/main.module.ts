import { NgModule } from '@angular/core';
import { RouterModule, Route } from '@angular/router';

import { StoreModule } from './store/store.module';
import { WorkshopModule } from './workshop/workshop.module';
import { DocsModule } from './docs/docs.module';
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
        DocsModule,
        OthersModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule, ReactiveFormsModule]
})
export class MainL1Module {}