import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-view',
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
  `,
  //styleUrls: ['./home.component.css']
})
export class MainViewComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
