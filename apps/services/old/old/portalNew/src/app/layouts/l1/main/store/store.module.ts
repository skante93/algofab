
import { Route, RouterModule } from "@angular/router";
import { NgModule } from '@angular/core';

import { StoreComponent } from './store.component';
import { StoreFrontComponent } from './front/front.component';
import { HttpClientModule } from '@angular/common/http';
import { ToolsModule } from 'src/app/tools/tools.module';

import { OthersModule } from '../others/others.module';
import { StoreListComponent } from './list/list.component';
import { StoreItemComponent } from './item/item.component';
import { StoreCreateComponent } from './create/create.component';
import { ReactiveFormsModule } from '@angular/forms';

const routes : Route[] = [
    { 
        path: "store",
        component: StoreComponent, 
        children : [
            { path: "front", pathMatch:"full", component: StoreFrontComponent },
            { path: "catalog", pathMatch:"full", component: StoreListComponent },
            { 
                path: "items",
                children: [
                    { path: ":id", component: StoreItemComponent }
                ]
            },
            { path: "create", pathMatch:"full", component: StoreCreateComponent },
        ]
    }
];


@NgModule({
    declarations: [
        StoreComponent,
        StoreFrontComponent,
        StoreListComponent,
        StoreItemComponent,
        StoreCreateComponent
    ],
    imports : [
        HttpClientModule,
        ToolsModule,
        OthersModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes)
    ],
    exports: [StoreComponent, StoreFrontComponent, RouterModule, ReactiveFormsModule]
})
export class StoreModule {}