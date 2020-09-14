import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CaptchaComponent } from '../bricks/captcha/captcha.component';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

var $ = window['$'];

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./login.component.css']
})
export class SigninComponent implements OnInit {

	model = {userID: '', password: ''};

	constructor(private auth: AuthService, private router: Router) { }

	ngOnInit(): void {
	}

	ngAfterViewInit() {
		$().bannerIMG();
		$().customStyles();
	}

	valid(): boolean { 
		return this.model.userID != '' && this.model.password != '';
	}

	onSubmit(){
		this.auth.login(this.model.userID, this.model.password).then((user)=>{
			console.log("Successful log in!!");
			$.notify("Successfully Lgged in", {className:"success", autoHideDelay: 4000, showDuration: 100, hideDuration: 100});

			this.router.navigate(['resources']);
		}).catch(e=>{ 
			console.log("Login failed!!", e);
		});
	}
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./login.component.css']
})
export class SignupComponent implements OnInit {
	
	@ViewChild(CaptchaComponent) reCaptcha: CaptchaComponent;
	
	usernamePattern: string = "^[a-z]{1}[a-z0-9]{3,20}$";

	model = {username: '', email: '', f_name: '', l_name:''};

	constructor(private http: HttpClient) { }

	ngOnInit(): void {
		
	}
	
	ngAfterViewInit() {
		$().bannerIMG();
		$().customStyles();
		setInterval(()=>{ console.log("Captcha response : ", this.reCaptcha.response()); }, 2000);
	}

	valid() {
		return this.model.username != "";
	}
	onSubmit(ev){
		var form = $("#signup-form");
		console.log("submitting : ", form.serializeArray());
	}
}

@Component({
	selector: 'app-signout',
	//templateUrl: './signup.component.html',
	template: '',
	styleUrls: ['./login.component.css']
})
export class SignoutComponent implements OnInit {

	constructor(private auth: AuthService, private router: Router) { }

	ngOnInit(): void {
		this.auth.logout();
		this.router.navigate(["signin"]);
	}

}
