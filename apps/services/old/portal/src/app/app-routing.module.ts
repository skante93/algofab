import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainViewComponent, HomeComponent } from './home/home.component';
import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { TestComponent } from './test/test.component';
import { ResourcesListComponent } from './resources/list/resources-list.component';
import { ResourcesPageComponent } from './resources/page/resources-page.component';
import { ResourcesComponent} from './resources/resources.component';
import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';

import { ResourcesModule } from './resources/resources.module';

import { AlgofabServicesModuule } from './algofab-services/algos.module';
import { StoreModule } from './store/store.module';


const routes: Routes = [
	//{path: "", pathMatch: "full", component: HomeComponent}
	{path: "signin", component: SigninComponent},
	{path: "signup", component: SignupComponent},
	{path: "signout", component: SignoutComponent},
	{path: "test", component: TestComponent},
	{
		path: "", 
		component: MainViewComponent,
		children: [
			{path: "about", component: AboutComponent},
			{path: "docs", component: DocsComponent},
			{path: "", pathMatch: "full", component: HomeComponent}
		]
	},
	{path: "**", component: NotfoundComponent}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes),
		ResourcesModule,
		AlgofabServicesModuule,
		StoreModule
	],
	exports: [RouterModule]
})
export class AppRoutingModule { }
