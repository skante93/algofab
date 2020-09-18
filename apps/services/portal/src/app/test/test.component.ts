import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../tools/nav/nav.component';

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
  
  constructor() { }

  ngOnInit(): void {
    setTimeout(()=> {
      console.log("this.nav : ", this.navComp);
      this.navComp.setItemDisplay('user_drop', false);
    }, 0);
  }

}
