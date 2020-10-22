
import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'docs-front',
    templateUrl: './front.component.html',
    styleUrls: ['./front.component.scss']
})
export class DocsFrontComponent implements OnInit {
    ngOnInit(): void {
        console.log("DocsFrontComponent started!!!");
    }
}