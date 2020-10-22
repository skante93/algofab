
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
    selector: 'docs',
    templateUrl: './docs.component.html',
    styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {
    constructor(private router: Router, private activatedRoute: ActivatedRoute){}

    ngOnInit(): void {
        console.log("DocsComponent started!!!");
        // this.activatedRoute.url.subscribe(url=>{
        //     if (this.router.url == '/docs'){
        //         this.router.navigate(['/docs/front']);;
        //     }
        // });
    }
}