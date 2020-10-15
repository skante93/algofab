


import { Route, RouterModule } from "@angular/router";
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

//import { ToolsModule } from '../../../../tools/tools.module';
import { ToolsModule } from 'src/app/tools/tools.module';

import { HeaderComponent } from './header/header.component';
import { TestComponent } from './test/test.component';
import { NotFoundComponent } from './not-found/not-found.component';


import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';


const routes : Route[] = [
    { path: "", pathMatch: "full", component:  HomeComponent },
    { path: "signin", pathMatch: "full", component:  SigninComponent },
    { path: "signup", pathMatch: "full", component:  SignupComponent },
    { path: "signout", pathMatch: "full", component:  SignoutComponent },
    { path: "test", component: TestComponent },
    
];


@NgModule({
    declarations: [
        HomeComponent,
        HeaderComponent,
        NotFoundComponent,
        TestComponent,
        SigninComponent,
        SignupComponent,
        SignoutComponent
    ],
    imports : [
        CommonModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ToolsModule,
        RouterModule.forChild(routes)
    ],
    exports: [ 
        HeaderComponent, 
        RouterModule ,
        CommonModule,
        BrowserModule,
        FormsModule,
    ]
})
export class OthersModule {}