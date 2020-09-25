import { Component, OnInit, ViewChild } from "@angular/core";

import { NavComponent } from '../tools/nav/nav.component';
import { MainService } from "../tools/services/main";
import { Observable, observable } from 'rxjs';

var $ = window['$'];

@Component({
    selector: '',
    templateUrl: './store-root.component.html',
    styleUrls: [ './store-root.component.scss' ]
})
export class StoreRootComponent implements OnInit {
    @ViewChild ('navbar', {static: true}) navbar: NavComponent;
    
    connected: boolean = false;

    left_nav: Array<any> = [
        { "name": "logo_algofab", "link": "/", "img": "/assets/img/algofab_white_bg.PNG", "classes": "header-nav-img" },
        { "name": "logo_imt", "link": "/", "img": "/assets/img/imt_logo_photoshop.png", "classes": "header-nav-img" }
    ];

    middle_nav: Array<any> = [
        { "name": "home", "link": "/", "text": "Home", "class": "" },
        { "name": "resources", "link": "/resources", "text": "Resources", "class": "" },
        { "name": "services", "link": "/services", "text": "Services", "class": "" },
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
    
    constructor(private mainService: MainService) {}

    ngOnInit(): void {
        console.log("Store Root Component started!!");
        this.createNavItems();
    }

    getBannerName(): Observable<string>{
        return new Observable<string>(observable=>{
            this.mainService.getRenderingTexts(['banner_name']).subscribe(texts=>{
                observable.next(texts['banner_name']);
                observable.complete();
            });
        });
    }

    createNavItems() {
        this.mainService.getRenderingTexts(['nav_home', 'nav_signin', 'nav_signup', 'nav_signout', 'banner_name', 'banner_introduction']).subscribe(
            texts=>{
                console.log("texts : ", texts);
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

                setTimeout(()=>{
                    console.log("Just decided to hide some stuff ...")
                    this.right_nav[3].display = false;
                }, 5000);
            },
            e=>{
                console.log("Failed to get Rendering Texts : ", e);
            }
        );
    }
}