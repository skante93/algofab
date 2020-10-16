
import { Component, OnInit, ViewChild } from '@angular/core';
import { NavComponent } from '../../../../../tools/nav/nav.component';
import { MainService } from '../../../../../tools/services/main';

@Component({
    selector: 'o-test',
    template: `
        <header></header>
    `,
    styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
    ngOnInit(): void {
        console.log("TestComponent started!!!");
    }
    
}