import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainViewComponent, HomeComponent } from './home/home.component';
import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { TestComponent } from './test/test.component';
import { ResourcesListComponent, ResourcesComponent, ResourcesPageComponent } from './resources/resources.component';
import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';

/*
import { TestComponent } from './test/test.component';
import { TestComponent } from './test/test.component';
import { TestComponent } from './test/test.component';
*/
const routes: Routes = [
	
	{path: "signin", component: SigninComponent},
	{path: "signup", component: SignupComponent},
	{path: "signout", component: SignoutComponent},
	{
		path: "", 
		component: MainViewComponent,
		children: [
			{
				path: "resources", 
				//component: ResourcesComponent,
				children: [
					{ path: "list", pathMatch: "full", component: ResourcesListComponent },
					{ path: ":id", component: ResourcesPageComponent },
					{ path: "", pathMatch: "full", component: ResourcesComponent}
					
				]
			},
			{path: "about", component: AboutComponent},
			{path: "docs", component: DocsComponent},
			{path: "test", component: TestComponent},
			{path: "", pathMatch: "full", component: HomeComponent}
		]
	},
	// {path: "resources", component: ResourcesComponent},
	// {path: "about", component: AboutComponent},
	// {path: "test", component: TestComponent},
	{path: "**", component: NotfoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
