

import { NgModule } from '@angular/core';

//import { ToolsModule } from '../tools/tools.module';

import { StoreRootComponent } from "./store-root.component";
import { StoreRoutingModule } from './store-root-routing.module';

import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [
        StoreRootComponent
    ],
    imports : [
        StoreRoutingModule,
    ],
    exports: [
        StoreRootComponent,
        StoreRoutingModule,
        RouterModule
    ]
})
export class StoreModule {}