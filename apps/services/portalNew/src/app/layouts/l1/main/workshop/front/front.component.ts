
import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'workshop-front',
    templateUrl: './front.component.html',
    styleUrls: ['./front.component.scss']
})
export class WorkshopFrontComponent implements OnInit {
    ngOnInit(): void {
        console.log("WorkshopFrontComponent started!!!");
    }
}