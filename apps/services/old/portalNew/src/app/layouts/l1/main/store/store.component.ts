
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
    selector: 'store',
    templateUrl: './store.component.html',
    styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
    
    constructor(private router: Router, private activatedRoute : ActivatedRoute){}

    ngOnInit(): void {
        // console.log("StoreComponent started!!!");
        // console.log("url : ", this.activatedRoute.snapshot.url);
        this.activatedRoute.url.subscribe(url=>{
            if (this.router.url == '/store'){
                this.router.navigate(['/store/front']);;
            }
        });
    }

}