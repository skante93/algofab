import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';

import { AuthService } from '../../services/auth/auth.service';

import { MenuLgItemComponent } from './sub/menu.component';


/*import * as $ from 'jquery';*/
var $ = window['$'];


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

	@ViewChild('toggleIcon', { static: false }) toggleIcon: ElementRef;
	
	@Input() wideThreeshold: number = 800;

	screenIsWide: boolean = true;

	menuSpec: any = {
		left : [
			{ "name": "logo_algofab", "link": "/", "img": "/assets/img/algofab_white_bg.PNG", "classes": "header-nav-img" },
			{ "name": "logo_imt", "link": "/", "img": "/assets/img/imt_logo_photoshop.png", "classes": "header-nav-img" }
		],
		middle: [
			{ "name": "home", "link": "/", "text": "Home", "class": "" },
			{ "name": "resources", "link": "/resources", "text": "Resources", "class": "" },
			{ "name": "docs", "link": "/docs", "text": "Docs", "class": "" },
			{ "name": "about", "link": "/about", "text": "About", "class": "" }
		],
		right: [
			{ "name": "signin", "link": "/signin", "text": "Signin", "classes": "white-link", "whenLoggedIn": false },
			{ "name": "signup", "link": "/signup", "text": "Signup", "classes": "white-link", "whenLoggedIn": false },
			{
				"name": "user_drop", 
				"link": "/account", 
				"dropdown": JSON.stringify({ 
					icon: "fa fa-user", 
					items: [{link:"/account", "text": "Account"}] 
				}), 
				"classes": "white-link", 
				"style": {color: "white"}, 
				"whenLoggedIn": true 
			},
			{ "name": "signout", "link": "/signout", "text": "Signout", "classes": "white-link", "style": {color: "white"}, "whenLoggedIn": true }
		]
	};

	constructor(private auth: AuthService) {
	}

	
	ngOnInit(): void {
		this.screenIsWide = $(document).width() > this.wideThreeshold;

		$(window).resize(()=>{
			this.screenIsWide = $(document).width() > this.wideThreeshold;
			//console.log("RESIZED , now screen is ", (this.screenIsWide? 'wide': 'small'));
		});
	}

	loggedIn(): boolean{ return this.auth.loggedIn(); }

	ngAfterViewInit() {

		var ti = this.toggleIcon.nativeElement;

		$(ti).click(()=>{
			//console.log("this.parent : ", $(ti).parents('.small-header-menu'));
			
			var menuItems = $(ti).parents('.small-header-menu').find('.menu-items');
			if (menuItems.is(':visible')){
				menuItems.fadeOut();
			}
			else{
				menuItems.css('display', 'flex').hide().fadeIn();
			}

			$(document).click(function(event){
				if (event.target !== ti && event.target !== menuItems[0] && !menuItems[0].contains(event.target) ){
					menuItems.fadeOut();
				}
			});
		})
		/*
		$(".small-header-menu").each((index, e)=>{
			$(e).find('.menu-toggle-icon').click(function(){
				console.log("this.parent : ", $(this).parents('.small-header-menu'));
				var menuItems = $(e).find('.menu-items');
				if (menuItems.is(':visible')){
					menuItems.fadeOut();
				}
				else{
					menuItems.css('display', 'flex').hide().fadeIn();
				}
			});

			$(document).click(function(event){
				if (event.target !== e && !e.contains(event.target) ){
					$(e).find('.menu-items').fadeOut();
				}
			});
		});
		*/
	}
}
