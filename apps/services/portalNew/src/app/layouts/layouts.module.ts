import { NgModule } from "@angular/core";

import { L1LayoutModule } from './l1/l1-layouts.module';
import { ToolsModule } from '../tools/tools.module';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        RouterModule,
        L1LayoutModule,
        ToolsModule
    ],
    // exports: [
    //     L1LayoutModule
    // ]
})
export class LayoutsModule {}