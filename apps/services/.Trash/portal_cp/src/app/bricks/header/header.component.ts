import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';

import { AuthService } from '../../services/auth/auth.service';

/*import * as $ from 'jquery';*/
var $ = window['$'];

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

	@ViewChild('nav', { static: false }) navComponent: ElementRef;
	
	JSON: any = JSON;
	menu: object = [
		{
			name: "logos",
			"style": {width: "25vw"},
			items: [
				{ "link": "/", "img": "/assets/img/algofab_white_bg.PNG", "class": "" },
				{ "link": "/", "img": "/assets/img/imt_logo_photoshop.png", "class": "" }
			],
		},
		{
			name: "nav-links",
			"style": {width: "55vw"},
			items: [
				{ "link": "/", "text": "Home", "class": "" },
				{ "link": "/resources", "text": "Resources", "class": "" },
				{ "link": "/about", "text": "About", "class": "" }
			],
		},
		{
			name: "login-state",
			"style": {width: "20vw", color: "white !important"},
			items: [
				{ "link": "/signin", "text": "Signin", "class": "", "style": {color: "white"} },
				{ "link": "/signup", "text": "Signup", "class": "", "style": {color: "white"} }
			],
		}
	]

	constructor(private auth: AuthService) {  }

	ngOnInit(): void {
	}

	ngAfterViewInit() {
		// console.log("HEADER NAV : ", this.navComponent.nativeElement);
		$(this.navComponent.nativeElement).attachIMTBackground();
		$().bannerIMG();
		$().customStyles();
	}
}
