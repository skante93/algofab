import { NgModule } from "@angular/core";
import { ToolsModule } from '../../tools/tools.module';
import { MainL1Module } from './main/main.module';
import { ReactiveFormsModule } from '@angular/forms';
@NgModule({
    imports: [
        MainL1Module,
        ToolsModule,
        ReactiveFormsModule
    ],
    exports: [
        MainL1Module,
        ReactiveFormsModule
    ]
})
export class L1LayoutModule {}