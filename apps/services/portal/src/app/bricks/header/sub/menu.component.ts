
import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';

var $ = window['$'];

@Component({
	selector: 'header-lg-menu',
	templateUrl: './menu-lg.component.html',
	styleUrls: ['./menu-lg.component.scss']
})
export class MenuLgItemComponent implements OnInit{
	@Input() name: string;
	@Input() link: string;
	@Input() classes: string;
	@Input() img: string;
	@Input() text: string;
	@Input() dropdown: any;
	@Input() display: any;
	
	@ViewChild('dropdownMenu', {static: false}) dropdownMenu : ElementRef;

	constructor(){}

	ngOnInit(): void {
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
	}
	ngAfterViewInit() {
		
		if (this.dropdown) {
			var dm = this.dropdownMenu.nativeElement;
            
			// dm.querySelector('.dropdown-btn').addEventListener('click', ()=>{
            //     console.log("Dropdown btn clicked");
			// 	$(dm).find('.dropdown-items').fadeToggle();
			// });

			//console.log("[", this.name, "] dropdown-btn pos ", $(dm).find('.dropdown-btn').position());

			var repositionDropdownItems = ()=>{
				var left = (8+$(dm).find('.dropdown-btn').position().left-$(dm).find('.dropdown-items').width()/2);

				$(dm).find('.dropdown-items').css({
					left: left+"px"
				});
			}
            // Making sure the view is completely rendered before repositionning for the first time
            
            //repositionDropdownItems();
			setTimeout(repositionDropdownItems, 500);
			
			document.addEventListener('resize', function(){
				repositionDropdownItems();
			});
			
			document.addEventListener('click', function(event){
				if (event.target !== dm && !dm.contains(event.target) ){
					$(dm).find('.dropdown-items').fadeOut();
				}
			});	
		}
    }
    toggleDropdown() {
        console.log("Toggling dropdown ...");
        if (this.dropdown) {
			$(this.dropdownMenu.nativeElement).find('.dropdown-items').fadeToggle();
        }
    }
}

@Component({
	selector: 'header-sm-menu',
	templateUrl: './menu-lg.component.html',
	styleUrls: ['./menu-sm.component.scss']
})
export class MenuSmItemComponent implements OnInit{
    @Input() name: string;
	@Input() link: string;
	@Input() classes: string;
	@Input() img: string;
	@Input() text: string;
	@Input() dropdown: any;
    @Input() display: any;
    
    @ViewChild('dropdownMenu', {static: false}) dropdownMenu : ElementRef;

    ngOnInit(): void {

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
    }
    ngAfterViewInit() {
        if (this.dropdown) {
			var dm = this.dropdownMenu.nativeElement;

			$(dm).find('.dropdown-btn').click(()=>{
				$(dm).find('.dropdown-items').fadeToggle();
			});

			console.log("[", this.name, "] Click handled");

			
			// Making sure the view is completely rendered before repositionning for the first time
            
            	
		}
    }
}