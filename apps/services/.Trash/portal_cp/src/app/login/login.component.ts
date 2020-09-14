import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { CaptchaComponent } from '../bricks/captcha/captcha.component';

var $ = window['$'];

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./login.component.css']
})
export class SigninComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
	}

	ngAfterViewInit() {
		$().bannerIMG();
		$().customStyles();
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

	constructor() { }

	ngOnInit(): void {
	}

}
