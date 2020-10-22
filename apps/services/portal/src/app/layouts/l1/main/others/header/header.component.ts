

import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../../../../../tools/nav/nav.component';
import { MainService } from '../../../../../tools/services/main';

@Component({
    selector: 'header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    @ViewChild ('navbar', {static: true}) navbar: NavComponent;
        
    connected: boolean = false;

    left_nav: Array<any> = [
        { "name": "logo_teralab", "link": "https://www.teralab-datascience.fr", "img": "/assets/img/teralab.png", "classes": "header-nav-img" },
        { "name": "logo_imt", "link": "https://www.imt.fr", "img": "/assets/img/imt_logo_photoshop.png", "classes": "header-nav-img" }
    ];

    middle_nav: Array<any> = [
        { "name": "home", "link": "/", "text": "Home", "class": "" },
        { "name": "store", "link": "/store", "text": "Resources", "class": "" },
        { "name": "workshop", "link": "/workshop", "text": "Workshop", "class": "" },
        { "name": "docs", "link": "/docs", "text": "Docs", "class": "" },
        //{ "name": "about", "link": "/about", "text": "About", "class": "" }
    ];

    right_nav: Array<any> = [
        { "name": "signin", "link": "/signin", "text": "Signin", "classes": "white-link", "display": false },
        { "name": "signup", "link": "/signup", "text": "Signup", "classes": "white-link", "display": false },
        {
            "name": "user_drop", 
            "dropdown": JSON.stringify({ 
                icon: "fa fa-user", 
                items: [{link:"/account", "text": "Account"}] 
            }), 
            "classes": "white-link", 
            "display": false
        },
        { "name": "signout", "link": "/signout", "text": "Signout", "classes": "white-link", "style": {color: "white"}, "display": false }
    ];

    banner_name: string = '';
    banner_introduction: string = '';

    constructor(public mainService: MainService){}

    ngOnInit(): void {
        console.log("Header started");
        this.resolveItemsInLang();
    }

    resolveItemsInLang() {
        this.mainService.getRenderingTexts(['nav_home', 'nav_store', 'nav_workshop', 'nav_docs', 'nav_signin', 'nav_signup', 'nav_signout', 'banner_name', 'banner_introduction']).subscribe(
            texts=>{
                console.log("texts : ", texts);

                this.middle_nav[0].text = texts['nav_home'];
                this.middle_nav[1].text = texts['nav_store'];
                this.middle_nav[2].text = texts['nav_workshop'];
                this.middle_nav[3].text = texts['nav_docs'];
                

                if (this.mainService.isLoggedIn()){
                    this.right_nav[2].display = true;
                    this.right_nav[3].display = true;
                }
                else{
                    this.right_nav[0].display = true;
                    this.right_nav[1].display = true;    
                }
                
                this.navbar.setItems( {left: this.left_nav, middle: this.middle_nav, right: this.right_nav } );
                this.banner_name = texts["banner_name"];
                this.banner_introduction = texts["banner_introduction"];

                // setTimeout(()=>{
                //     console.log("Just decided to hide some stuff ...")
                //     this.right_nav[3].display = false;
                // }, 5000);
            },
            e=>{
                console.log("Failed to get Rendering Texts : ", e);
            }
        );
    }
}
