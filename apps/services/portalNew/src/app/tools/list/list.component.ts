
import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

/*import * as $ from 'jquery';*/
var $ = window['$'];

@Component({
	selector: 'tools-list',
    templateUrl: './list.component.html', 
    styleUrls: [ './list.component.scss' ]
})
export class ListComponent implements OnInit {
    @Input() listStyle;
    @Input() items_spec;

    // @ViewChild('listStyleComponent') listStyleComponent: ElementRef;
    // @ViewChild('galleryStyleComponent') galleryStyleComponent: ElementRef;
    
    default_logo: string = '/assets/img/algofab.PNG';
    default_icon: string = '/assets/img/algofab.PNG';

    styles: any = {
        'list': { icon : 'fas fa-list', selected: false},
        'gallery': {icon: 'fas fa-clone', selected: true}
    };
    
    constructor(private router: Router) {}

    ngOnInit(): void {
        if (typeof this.items_spec === 'string' ){
            this.items_spec = JSON.parse(this.items_spec);
        }
        for (var s in this.styles){
            if (this.styles[s].selected === true){
                this.listStyle = s;
                break;
            }
        }
        if (typeof this.listStyle === 'undefined' || this.listStyle == null) {
            this.listStyle = 'list';
            this.styles['list'].selected = true;
            this.styles['gallery'].selected = false;
        }
        
        //console.log("items_spec [", typeof this.items_spec, "] : ", this.items_spec);
    }

    ngAfterViewInit(){
        //console.log("### after view init!!!", this.galleryStyleComponent.nativeElement);
        //$(this.galleryStyleComponent.nativeElement);
        this.changeBackgrounds();
    }

    changeBackgrounds(){

        setInterval(()=>{
            //console.log("All bg images : ", document.querySelector('[bg-img]') );
            $('[bg-img]').each((i, e)=>{
                $(e).css ({
                    "background-image": `url(${$(e).attr("bg-img")})`,
                });
            });
        },300);
    }

    changeStyle(s){
        this.listStyle = s;

        for (var st in this.styles){
            this.styles[st].selected = st == s? true : false;
        }

        //console.log('Style is now : ', this.listStyle);
    }
    
    redirectToPage(link) {
        this.router.navigate([link]);
    }
}
