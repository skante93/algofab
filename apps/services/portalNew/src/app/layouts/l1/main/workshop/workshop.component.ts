
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
    selector: 'workshop',
    templateUrl: './workshop.component.html',
    styleUrls: ['./workshop.component.scss']
})
export class WorkshopComponent implements OnInit {
    constructor(private router: Router){}

    ngOnInit(): void {
        console.log("WorkshopComponent started!!!");
        this.router.navigate(["/workshop/front"]);
    }
}