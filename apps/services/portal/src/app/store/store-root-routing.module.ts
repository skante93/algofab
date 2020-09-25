

import { Routes, RouterModule } from '@angular/router';

import { StoreRootComponent } from './store-root.component';

import { NgModule } from '@angular/core';


import { ToolsModule } from '../tools/tools.module';

const routes: Routes = [
	{
		path: "store", 
		component: StoreRootComponent,
		// children: [
		// 	{path: "about", component: AboutComponent},
		// 	{path: "docs", component: DocsComponent},
		// 	{path: "", pathMatch: "full", component: HomeComponent}
		// ]
    }
];

@NgModule({
	imports: [
        RouterModule.forRoot(routes),
        ToolsModule
	],
	exports: [RouterModule, ToolsModule]
})
export class StoreRoutingModule { }