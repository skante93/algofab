
import { Route, RouterModule } from "@angular/router";
import { NgModule } from '@angular/core';

import { WorkshopComponent } from './workshop.component';
import { WorkshopFrontComponent } from './front/front.component';
import { HttpClientModule } from '@angular/common/http';
import { ToolsModule } from 'src/app/tools/tools.module';
import { OthersModule } from '../others/others.module';

const routes : Route[] = [
    { 
        path: "workshop",
        component: WorkshopComponent, 
        //pathMatch: "full",
        children : [
            { path: "front", component: WorkshopFrontComponent }
        ]
    }
];


@NgModule({
    declarations: [
        WorkshopComponent,
        WorkshopFrontComponent
    ],
    imports : [
        HttpClientModule,
        ToolsModule,
        OthersModule,
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule]
})
export class WorkshopModule {}