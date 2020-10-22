
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
    selector: 'workshop',
    templateUrl: './workshop.component.html',
    styleUrls: ['./workshop.component.scss']
})
export class WorkshopComponent implements OnInit {
    constructor(private router: Router, private activatedRoute: ActivatedRoute){}

    ngOnInit(): void {
        console.log("WorkshopComponent started!!!");
        // this.router.navigate(["/workshop/front"]);
        // this.activatedRoute.url.subscribe(url=>{
        //     if (this.router.url == '/docs'){
        //         this.router.navigate(['/docs/front']);;
        //     }
        // });
    }
}