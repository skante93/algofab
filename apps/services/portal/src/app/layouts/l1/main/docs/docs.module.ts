
import { Route, RouterModule } from "@angular/router";
import { NgModule } from '@angular/core';

import { DocsComponent } from './docs.component';
import { DocsFrontComponent } from './front/front.component';
import { HttpClientModule } from '@angular/common/http';
import { ToolsModule } from '../../../../tools/tools.module';
import { OthersModule } from '../others/others.module';

const routes : Route[] = [
    { 
        path: "docs",
        component: DocsComponent, 
        //pathMatch: "full",
        children : [
            { path: "front", component: DocsFrontComponent }
        ]
    }
];


@NgModule({
    declarations: [
        DocsComponent,
        DocsFrontComponent
    ],
    imports : [
        HttpClientModule,
        ToolsModule,
        OthersModule,
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule]
})
export class DocsModule {}