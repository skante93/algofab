
import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../../../tools/nav/nav.component';
import { MainService } from '../../../tools/services/main';

@Component({
    selector: 'main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
    

    constructor(private mainService: MainService){}

    ngOnInit(): void {
        console.log("WorkshopComponent started!!!");
    }

    
}