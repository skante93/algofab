import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './bricks/header/header.component';
import { TestComponent } from './test/test.component';
/*
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
*/
import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { ResourceComponent, ResourcesComponent } from './resources/resources.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { AboutComponent } from './about/about.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CaptchaComponent } from './bricks/captcha/captcha.component';

import { AuthService } from './services/auth/auth.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    TestComponent,
    SigninComponent,
    SignupComponent,
    SignoutComponent,
    ResourceComponent,
    ResourcesComponent,
    NotfoundComponent,
    AboutComponent,
    CaptchaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
