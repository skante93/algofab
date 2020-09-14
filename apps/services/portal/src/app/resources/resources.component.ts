import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ResourcesService } from '../services/resources/resources.service';
import { Router, ActivatedRoute } from '@angular/router';

var $ = window['$'];

@Component({
	selector: 'app-resources-list-item',
	/*templateUrl: './resources.component.html',*/
	template: `
		<div #comp>
			<div class="resource-header">
				<div class="resource-name">{{name}}</div>
				<div class="resource-type"><img src="/assets/img/{{type}}.svg"></div>
			</div>

			<div class="resource-content">
				<div class="resource-logo">Logo</div>
				
				<button class="more-btn btn btn-primary" (click)="redirectToResourcePage()"> More... </button>
			</div>
		</div>
	`,
	//styleUrls: ['./resources.component.css']
})
export class ResourcesListItemComponent implements OnInit {

	@Input() id: String;
	@Input() name: String;
	@Input() type: String;
	@Input() intro: String;
	
	@ViewChild('comp', { static: false }) comp: any;
	minWidth: number = 250;
	maxWidth: number = 350;
	constructor(private router: Router) { }

	ngOnInit(): void {
		/*console.log("Hello from resource id ", this.id, " : ");*/
	}

	ngAfterViewInit() {
		//console.log("RESOURCE : ", this.comp.nativeElement);
		
		// $(this.comp.nativeElement).attr('id', this.id)
		// 	.attr('name', this.name)
		// 	.attr('type', this.type)
		// 	.attr('intro', this.intro)
		// 	.styleResource();
		// //$().bannerIMG();
		// $().customStyles();
		this.applyStyles();

		$(window).resize(()=> this.applyStyles() );
	}

	currentDimensions(){
		var width = Math.max(Math.min($(window).width()/3, this.maxWidth), this.minWidth), height = width*1.2;
		//console.log("currentdim: (", width, ", ", height, ")")
		return [width, height];
	}

	applyStyles(){
		var dims = this.currentDimensions();

		var header = $(this.comp.nativeElement).find('.resource-header');
		var content = $(this.comp.nativeElement).find('.resource-content');

		$(this.comp.nativeElement).css({
			"width": dims[0]+"px",
			"height": dims[1]+'px',
			"position": "relative",
			"margin": "1em",
			/*"border": "1px solid black"*/
		});

		header.css({
			"display": "flex",
			"position": "absolute",
			"align-items": "center",
			"margin-left": "1em",
			"margin-top": "1em",
			"border": "1px solid blue",
			"border-radius": "0.5em 0 0.5em 0",
			"background-image": "linear-gradient(350deg, #00b8de 5%, rgba(250,250,250,1) 90%)",
			"box-shadow": "5px 5px 5px grey",
			"width": dims[0],
			"height": dims[1]*0.2, // 20 % to total height
			"z-index": 2
		});

		header.find('.resource-name').css({
			"width": (dims[0]*0.7)+'px',
			"padding":"1em",
			/*"border": "1px solid green",*/
		});

		header.find('.resource-type').css({
			"width": (dims[0]*0.3)+'px',
		});

		content.css({
			"width": dims[0],
			"height": dims[1]*0.8,
			"padding-top": "2em",
			"bottom": 0,
			"color": "white",
			"border-radius": "0.5em",
			"position": "absolute",
			"background-image": "linear-gradient(350deg, rgba(10,10,10,1) 5%, rgba(0,0,128,1) 90%)",
			"border": "1px solid orange",
			"box-shadow": "5px 5px 5px grey",
			"z-index": 1
		});

		content.find('.more-btn').css({ 
			"position": "absolute", 
			"bottom": "5px", 
			"right": "5px",
			/*"cursor": "pointer"*/
		});
	}

	redirectToResourcePage(){
		this.router.navigate(['resources', this.id]);
	}
}

@Component({
	selector: 'app-resources-item',
	template: `
		<div class="resource-list-container" [hidden]="!resourcesDef">
		  	<app-resources-list-item 
				*ngFor="let resource of resourcesDef" 
				intro="{{resource.intro}}" 
				type="{{resource.type}}" 
				name="{{resource.name}}" 
				id="{{resource.id}}">
			</app-resources-list-item>
		</div>
		<div [hidden]="resourcesDef">
			Now loading !!!
		</div>
	`,
	styleUrls: ['./resources.component.scss']
})
export class ResourcesListComponent implements OnInit {

	resourcesDef : any ;

	constructor(private resourcesService: ResourcesService) { }

	ngOnInit(): void {
		this.resourcesService.getAllResources().subscribe(
			(res)=>{ 
				console.log("Success!! Response is : ", res); 
				this.resourcesDef = res['body'].map(r=> {
					return { 
						id: r._id,
						name: r.metadata.name,
						type: r.metadata.asset_type,
						intro: r.metadata.short_intro,
						tags: r.metadata.tags
					} 
				});
			},
			(err)=>{
				console.log("Oups, error: ", err)
			},
			()=> {
				console.log("Anyway we are done fetching all resources!!");
			}
		)
	}
}
  
@Component({
	selector: 'app-resources-page',
	templateUrl: "./resources-page.component.html",
	styleUrls: ['./resources-page.component.scss']
})
export class ResourcesPageComponent implements OnInit {
	id: string;
	resource: any;

	constructor(private activatedRoute: ActivatedRoute, private resourcesService: ResourcesService){ }

	ngOnInit(): void {
		console.log("Getting algo i");
		this.activatedRoute.params.subscribe(p=> {
			this.id = p['id'];
			this.resourcesService.getResource(this.id).subscribe(
				(res)=>{
					console.log("res : ", res);
					this.resource = res['body'];
				},
				(err)=>{
					console.log("err: ", err);
				},
				()=>{
					console.log("Done!!!");
				}
			)
		});
	}
	
}
@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
	}
}
