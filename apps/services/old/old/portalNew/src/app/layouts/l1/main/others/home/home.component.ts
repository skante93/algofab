

import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../../../../../tools/nav/nav.component';
import { MainService } from '../../../../../tools/services/main';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    ngOnInit(): void {
        console.log("HomeComponent started!!!");
    }
}