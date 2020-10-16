


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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { AccountComponent } from './account/account.component';


const routes : Route[] = [
    { path: "signin", pathMatch: "full", component:  SigninComponent },
    { path: "signup", pathMatch: "full", component:  SignupComponent },
    { path: "signout", pathMatch: "full", component:  SignoutComponent },
    { path: "test", component: TestComponent },
    { 
        path: "account", 
        //pathMatch: "full", 
        component: HomeComponent, 
        children: [
            {path:"", pathMatch:"full", component: AccountComponent}
        ]
    },
    { path: "", pathMatch: "full", component:  HomeComponent },
];


@NgModule({
    declarations: [
        HomeComponent,
        HeaderComponent,
        NotFoundComponent,
        TestComponent,
        SigninComponent,
        SignupComponent,
        SignoutComponent,
        AccountComponent,
    ],
    imports : [
        CommonModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        ToolsModule,
        RouterModule.forChild(routes)
    ],
    exports: [ 
        HeaderComponent, 
        RouterModule ,
        CommonModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
    ]
})
export class OthersModule {}