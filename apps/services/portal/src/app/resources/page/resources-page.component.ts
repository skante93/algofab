
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ResourcesService } from '../../services/resources/resources.service';
import { Router, ActivatedRoute } from '@angular/router';

var $ = window['$'];

@Component({
	selector: 'app-resources-page',
	templateUrl: "./resources-page.component.html",
	styleUrls: ['./resources-page.component.scss']
})
export class ResourcesPageComponent implements OnInit {
	id: string;
	resource: any;
    default_logo: string = "/assets/img/algofab_white_bg.PNG";

	constructor(private activatedRoute: ActivatedRoute, private resourcesService: ResourcesService){ }

	ngOnInit(): void {
		console.log("Getting algo i");
		this.activatedRoute.params.subscribe(p=> {
			this.id = p['id'];
			this.resourcesService.getResource(this.id).subscribe(
				(res)=>{
					console.log("res : ", res);
                    this.resource = res['body'];
                    console.log("this.resource.metadata : ", this.resource.metadata);
                    console.log("this.resource.metadata.tags : ", this.resource.metadata.tags[0].name);
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

    toggleNav() {
        console.log("Go ahead and toggle it...");
    }

    hoverStar(index: number){
        //console.log("Hoverd on i = ", index);
        $("#smiley i").attr('class', ()=>{
            return index == 0 ? 'fas fa-angry' : 
                        index == 1? 'fas fa-frown' : 
                            index == 2 ? 'fas fa-meh' : 
                                index == 3 ? 'fas fa-smile' : 'fas fa-smile-beam';
        }); 
        var stars = $("#stars span i").css('color', 'black');

        for (var i=0; i<=index; i++){
            $(stars[i]).css('color', 'yellow');
        }
    }

    vote(stars) {
        console.log("we voted with ", stars, "stars.");
    }
    logoSrc() {
        if (this.resource != undefined && this.resource.metadata.logo != undefined && this.resource.metadata.logo != null){
            // TODO get logo from it
            return this.resource.metadata.logo;
        }
        else{
            return this.default_logo;
        }
    }
}