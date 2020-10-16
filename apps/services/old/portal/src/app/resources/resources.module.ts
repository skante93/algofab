import { NgModule } from "@angular/core";

import { ResourcesListItemComponent, ResourcesListComponent } from './list/resources-list.component';
import { ResourcesPageComponent } from './page/resources-page.component';
import { ResourcesComponent } from './resources.component';

import { MainViewComponent ,HomeComponent } from '../home/home.component';

import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { Routes, RouterModule } from  '@angular/router';



const routes: Routes = [
    {
		path: "resources", 
		component: MainViewComponent,
		children: [
            { path: "list", pathMatch: "full", component: ResourcesListComponent },
            { path: ":id", component: ResourcesPageComponent },
            { path: "", pathMatch: "full", component: ResourcesComponent}
        ]
	}
];

@NgModule({
    declarations: [
        ResourcesListItemComponent,
        ResourcesListComponent,
        ResourcesPageComponent,
        ResourcesComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        HttpClientModule,
        FormsModule,
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule]
})
export class ResourcesModule {}