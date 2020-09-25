import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../tools/nav/nav.component';
import { MainService } from '../tools/services/main';

var $ = window['$'];

@Component({
	selector: 'app-test',
	templateUrl: './test.component.html',
	styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
	@ViewChild('navComp', { static: false }) navComp: NavComponent;
  
	example_menu = JSON.stringify({
		left : [
			{ "name": "logo_algofab", "link": "/", "img": "/assets/img/algofab_white_bg.PNG", "classes": "header-nav-img" },
			{ "name": "logo_imt", "link": "/", "img": "/assets/img/imt_logo_photoshop.png", "classes": "header-nav-img" }
		],
		middle: [
			{ "name": "home", "link": "/", "text": "Home", "class": "" },
			{ "name": "resources", "link": "/resources", "text": "Resources", "class": "" },
			{ "name": "services", "link": "/services", "text": "Services", "class": "" },
			{ "name": "docs", "link": "/docs", "text": "Docs", "class": "" },
			{ "name": "about", "link": "/about", "text": "About", "class": "" }
		],
		right: [
			{ "name": "signin", "link": "/signin", "text": "Signin", "classes": "white-link", "display": false },
			{ "name": "signup", "link": "/signup", "text": "Signup", "classes": "white-link", "display": false },
			{
				"name": "user_drop", 
				"dropdown": JSON.stringify({ 
					icon: "fa fa-user", 
					items: [{link:"/account", "text": "Account"}] 
				}), 
				"classes": "white-link", 
			},
			{ "name": "signout", "link": "/signout", "text": "Signout", "classes": "white-link", "style": {color: "white"} }
		]
	});
  
	example_list : any = JSON.stringify([
		{
			title: 'Example 1',
			logo : '/assets/img/algofab.PNG',
			//icon: '/assets/img/dataset.svg',
			introduction: "Simple introduction",
			redirect: '/services'
		},
		{
			title: 'Example 2',
			logo : '/assets/img/teralab.png',
			icon: '/assets/img/notebook.svg',
			introduction: "Notebook icon",
			redirect: '/services'
		},
		{
			title: 'Example 3',
			//logo : '/assets/img/algofab.PNG',
			icon: '/assets/img/library.svg',
			introduction: "Did not specify logo, library icon",
			redirect: '/services'
		},
		{
			title: 'Example 4',
			logo : '/assets/img/algofab.PNG',
			//icon: '/assets/img/dataset.svg',
			introduction: "Did not spefici icon",
			redirect: '/services'
		},
		{
			title: 'Example 5',
			logo : '/assets/img/algofab.PNG',
			icon: '/assets/img/dataset.svg',
			introduction: "Check redirection",
			redirect: '/services/toto'
		},
		{
			title: 'Example 1',
			logo : '/assets/img/algofab.PNG',
			icon: '/assets/img/dataset.svg',
			introduction: "Simple introduction",
			redirect: '/services'
		},
		{
			title: 'Example 1',
			logo : '/assets/img/algofab.PNG',
			icon: '/assets/img/dataset.svg',
			introduction: "Simple introduction",
			redirect: '/services'
		},
	]);

	example_auto_form: any = JSON.stringify({
		Status: {
			type: "string",
			enum: ["user", "admin"]
		},
		Username: {
			type: "string",
			pattern: "^[a-z][a-z0-9]{2,}",
		},
		Password: {
			type: "string",
			format: "pasword"
		},
		Age: {
			type: "integer",
			minimum: 18,
			maximum: 90
		},
		Married: {
			type: "boolean",
			true: "Yes",
			false: "No",
			required: true
		}
	});
	constructor(private mainService: MainService) { }

	ngOnInit(): void {
		this.mainService.showSettings();
		console.log("TEST COMPONENT STARTED!!");
		$.notify('Success cool!!')
		setTimeout(()=> {
		//console.log("this.nav : ", this.navComp);
		//this.navComp.setItemDisplay('user_drop', false);
		}, 0);
	}
}
