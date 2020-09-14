import { Component, OnInit, Input, ViewChild } from '@angular/core';

var $ = window['$'];

@Component({
  selector: 'app-resource',
/*  templateUrl: './resources.component.html',*/
  template: '<div #comp ></div>',
  styleUrls: ['./resources.component.css']
})
export class ResourceComponent implements OnInit {

	@Input() id: String;
	@Input() name: String;
	@Input() type: String;
	@Input() intro: String;
	
	@ViewChild('comp', { static: false }) comp: any;

	constructor() { }

	ngOnInit(): void {
		/*console.log("Hello from resource id ", this.id, " : ");*/
	}

	ngAfterViewInit() {
		//console.log("RESOURCE : ", this.comp.nativeElement);
		
		$(this.comp.nativeElement).attr('id', this.id)
			.attr('name', this.name)
			.attr('type', this.type)
			.attr('intro', this.intro)
			.styleResource();
		$().bannerIMG();
		$().customStyles();
	}
}


@Component({
  selector: 'app-resources',
  template: `
  	<app-header></app-header>
  	<div class="resource-list-container">
		<app-resource *ngFor="let resource of resourcesDef" intro="{{resource.intro}}" type="{{resource.type}}" name="{{resource.name}}" id="{{resource.id}}"></app-resource>
	</div>
  `,
  styleUrls: ['./resources.component.css']
})
export class ResourcesComponent implements OnInit {

	resourcesDef : any = [
		{ "id": "id-1", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-2", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-3", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-4", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-5", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-6", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-7", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-8", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-9", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  },
		{ "id": "id-10", "name": "Example Resource", "type": "notebook", "intro": "Short introduction"  }
	];

	constructor() { }

	ngOnInit(): void {
	}

}
