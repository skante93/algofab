import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { TestComponent } from './test/test.component';
import { ResourcesComponent } from './resources/resources.component';
import { AboutComponent } from './about/about.component';

/*
import { TestComponent } from './test/test.component';
import { TestComponent } from './test/test.component';
import { TestComponent } from './test/test.component';
*/
const routes: Routes = [
	{path: "", pathMatch: 'full', component: HomeComponent},
	{path: "signin", component: SigninComponent},
	{path: "signup", component: SignupComponent},
	{path: "signout", component: SignoutComponent},
	{path: "resources", component: ResourcesComponent},
	{path: "about", component: AboutComponent},
	{path: "test", component: TestComponent},
	{path: "**", component: NotfoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
