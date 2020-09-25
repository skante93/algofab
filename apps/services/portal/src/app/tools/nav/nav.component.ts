import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';

/*import * as $ from 'jquery';*/
var $ = window['$'];

@Component({
	selector: 'tools-nav-item',
	template: `
		<ng-template [ngIf]="ready">
			
			<ng-template #dropDownItemView>
				<span 
					[hidden]="!display"
					[attr.class]="itemsClasses()" #dropdownMenu>
					
					<button class="dropdown-btn" (click)="toggleDropdown($event)" (focus)="ddBtnFocused($event)" (focusout)="ddBtnFocusedOut($event)"> 
						<ng-template [ngIf]="dropdown.icon != undefined">
							<i class="{{dropdown.icon}}" [hidden]="dropdown.icon == undefined"></i>
						</ng-template>
						<ng-template [ngIf]="dropdown.text != undefined">
							<span class="" [hidden]="dropdown.icon != undefined">{{dropdown.text}}</span>
						</ng-template> 
					</button>
					<div class="{{dropDownStyle == 'small'? 'small-' : ''}}dropdown-items" *ngIf="dropdown.items != undefined">
						<a *ngFor="let d of dropdown.items" routerLink="{{d.link}}">{{d.text}}</a>
					</div>
				</span>
			</ng-template>

			<a *ngIf="dropdown == undefined; else dropDownItemView"
				[hidden]="!display"
				[routerLink]="dropdown == undefined ? link : null"
				[attr.class]="itemsClasses()">
				
				<ng-template [ngIf]="img != undefined">
					<img src="{{img}}">
				</ng-template>
				<ng-template [ngIf]="text != undefined">
					{{text}}
				</ng-template>
			</a>
		</ng-template>
	`,
	styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent implements OnInit{
	@Input() name: string;
	@Input() link: string;
	@Input() classes: string;
	@Input() img: string;
	@Input() text: string;
	@Input() dropdown: any;
	@Input() dropDownStyle: string;
	@Input() display: any;

	@ViewChild('dropdownMenu', {static: false}) dropdownMenu : ElementRef;

	ready: boolean = false;

	constructor(){}

	ngOnInit(): void {
		//console.log("ToolsNavItem started!!!");
		if (typeof this.dropdown !== 'undefined'){
			try{
				this.dropdown = JSON.parse(this.dropdown);
			}
			catch(e){}
		}
		//console.log(`**** [${this.name}] | display [${typeof this.display}]:`, this.display, ` ****`);
		if (typeof this.display != "boolean"){
			this.display = typeof this.display === 'undefined' || this.display == "false"? false : true;
		}
		//console.log(`**** [${this.name}] | display [${typeof this.display}]:`, this.display, ` ****`);

		//console.log(`**** [${this.name}] | dropDownStyle [${typeof this.dropDownStyle}]:`, this.dropDownStyle, ` ****`);
		
		if (this.dropDownStyle == "small"){
			this.applySmallScreenDropDown();
		}
		else{
			this.applyLargeScreenDropDown();
		}
		setTimeout(()=>{ 
			this.ready = true;
			//console.log(`**** [${this.name}] | display [${typeof this.display}]:`, this.display, ` ****`);
		}, 1000);
	}

	itemsClasses(){
		var classes = `menu-item-link ${this.dropdown? 'menu-dropdown': ''}`;
		return classes.trim().split(' ').map( e=> this.dropDownStyle == "small"? "small-"+e : e).join(' ')+ (this.classes? ' '+this.classes: '');
	}
	
	ddBtnFocused(event) {
		//console.log("Just fuocused on dd : ", event.target);
		$(event.target).trigger("focusout");
	}

	ddBtnFocusedOut(event) {
		//console.log("Just fuocused out on dd : ", event.target);
		$(document).trigger("focusout");
	}

	toggleDropdown(event) {
		//console.log("Toggling dropdown ...");
		if (this.dropDownStyle == "small"){
			$(this.dropdownMenu.nativeElement).find('.small-dropdown-items').fadeToggle();
		}
		else{
			//console.log("$(this.toggleBtn.nativeElement) : ", $(this.dropdownMenu.nativeElement));
			$(this.dropdownMenu.nativeElement).find(".dropdown-items").fadeToggle();
		}
        // if (this.dropdown) {
		// 	$(this.dropdownMenu.nativeElement).find('.dropdown-items').fadeToggle();
        // }
    }

	applySmallScreenDropDown() {
		//console.log("Applying small style dropdown ...");
	}

	applyLargeScreenDropDown() {
		//console.log("Applying wide style dropdown ...");

		var interv = setInterval(()=>{
			if (!this.dropdownMenu)
				return;
			clearInterval(interv);

			if (this.dropdown) {
				var dm = this.dropdownMenu.nativeElement;
				
				// dm.querySelector('.dropdown-btn').addEventListener('click', ()=>{
				//     console.log("Dropdown btn clicked");
				// 	$(dm).find('.dropdown-items').fadeToggle();
				// });
	
				//console.log("[", this.name, "] dropdown-btn pos ", $(dm).find('.dropdown-btn').position());
	
				var repositionDropdownItems = ()=>{
					//console.log("Repositioning ...");
					var left = (8+$(dm).find('.dropdown-btn').position().left-$(dm).find('.dropdown-items').width()/2);
	
					$(dm).find('.dropdown-items').css({
						left: left+"px"
					});
				}
				
				repositionDropdownItems();
				
				$(window).resize( repositionDropdownItems );
				
				document.addEventListener('click', function(event){
					if (event.target !== dm && !dm.contains(event.target) ){
						$(dm).find('.dropdown-items').fadeOut();
					}
				});	
			}
		}, 500);
		
		
	}
	
	
    
}


@Component({
	selector: 'tools-nav',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

	@ViewChild('toggleIcon', { static: false }) toggleIcon: ElementRef;
	
	@Input() wideThreeshold: number = 800;
	@Input() items: any;

	screenIsWide: boolean;
	
	
	// menuSpec: any = {
	// 	left : [
	// 		{ "name": "logo_algofab", "link": "/", "img": "/assets/img/algofab_white_bg.PNG", "classes": "header-nav-img" },
	// 		{ "name": "logo_imt", "link": "/", "img": "/assets/img/imt_logo_photoshop.png", "classes": "header-nav-img" }
	// 	],
	// 	middle: [
	// 		{ "name": "home", "link": "/", "text": "Home", "class": "" },
	// 		{ "name": "resources", "link": "/resources", "text": "Resources", "class": "" },
	// 		{ "name": "services", "link": "/services", "text": "Services", "class": "" },
	// 		{ "name": "docs", "link": "/docs", "text": "Docs", "class": "" },
	// 		{ "name": "about", "link": "/about", "text": "About", "class": "" }
	// 	],
	// 	right: [
	// 		{ "name": "signin", "link": "/signin", "text": "Signin", "classes": "white-link", "whenLoggedIn": false },
	// 		{ "name": "signup", "link": "/signup", "text": "Signup", "classes": "white-link", "whenLoggedIn": false },
	// 		{
	// 			"name": "user_drop", 
	// 			"dropdown": JSON.stringify({ 
	// 				icon: "fa fa-user", 
	// 				items: [{link:"/account", "text": "Account"}] 
	// 			}), 
	// 			"classes": "white-link", 
	// 			"whenLoggedIn": true 
	// 		},
	// 		{ "name": "signout", "link": "/signout", "text": "Signout", "classes": "white-link", "style": {color: "white"}, "whenLoggedIn": true }
	// 	]
	// };
	//

	constructor() {
	}

	setItems(items){ this.items = items }
	
	ngOnInit(): void {
		//console.log("Nav component started!!!");

		this.bindScreenIsWide();

		if (typeof this.items !== 'undefined'){
			try{
				this.items = JSON.parse(this.items);
			}
			catch(e){}
		}
	}

	bindScreenIsWide(): void {
		this.screenIsWide = $(document).width() > this.wideThreeshold;

		$(window).resize(()=>{
			this.screenIsWide = $(document).width() > this.wideThreeshold;
			//console.log("RESIZED , now screen is ", (this.screenIsWide? 'wide': 'small'));
		});
	}


	ngAfterViewInit() {

		var interv = setInterval(()=>{
			if (!this.items) {
				return
			}
			clearInterval(interv);

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
			});
		}, 1000);
	}

	setItemDisplay(name:string, diplayed:boolean) {
		for (var section in this.items){
			this.items[section].forEach(element => {
				if (element.name == name){
					element.display = diplayed;
				}
			});
		}
	}
}
