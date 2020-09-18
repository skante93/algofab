import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainViewComponent ,HomeComponent } from './home/home.component';
import { MenuLgItemComponent, MenuSmItemComponent } from './bricks/header/sub/menu.component';
import { HeaderComponent } from './bricks/header/header.component';
import { TestComponent } from './test/test.component';
/*
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
*/
import { SigninComponent, SignupComponent, SignoutComponent } from './login/login.component';
import { ResourcesListItemComponent, ResourcesListComponent } from './resources/list/resources-list.component';
import { ResourcesPageComponent } from './resources/page/resources-page.component';
import { ResourcesComponent } from './resources/resources.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { AboutComponent } from './about/about.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CaptchaComponent } from './bricks/captcha/captcha.component';

import { AuthService } from './services/auth/auth.service';
import { ResourcesService } from './services/resources/resources.service';
import { DocsComponent } from './docs/docs.component';

import { ToolsModule } from './tools/tools.module';

@NgModule({
  declarations: [
    AppComponent,
    MainViewComponent,
    HomeComponent,
    MenuLgItemComponent,
    MenuSmItemComponent,
    HeaderComponent,
    TestComponent,
    SigninComponent,
    SignupComponent,
    SignoutComponent,
    NotfoundComponent,
    AboutComponent,
    CaptchaComponent,
    DocsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ToolsModule
    //ResourcesModule
  ],
  providers: [AuthService, ResourcesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
