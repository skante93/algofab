
import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'store-front',
    templateUrl: './front.component.html',
    styleUrls: ['./front.component.scss']
})
export class StoreFrontComponent implements OnInit {
    ngOnInit(): void {
        console.log("StoreFrontComponent started!!!");
    }
}