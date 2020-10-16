import { NgModule } from "@angular/core";

import { L1LayoutModule } from './l1/l1-layouts.module';
import { ToolsModule } from '../tools/tools.module';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        RouterModule,
        L1LayoutModule,
        ToolsModule,
        ReactiveFormsModule,
    ],
    exports: [
        ReactiveFormsModule,
    ]
    // exports: [
    //     L1LayoutModule
    // ]
})
export class LayoutsModule {}