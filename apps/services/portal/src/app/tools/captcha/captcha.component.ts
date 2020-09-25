import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

var $ = window['$'];

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css']
})
export class CaptchaComponent implements OnInit {

  @Input() siteKey: string;

  @ViewChild('reCaptcha', { static: true }) reCaptcha: ElementRef;
  
  challengeResponse: string;
  constructor() { }

  ngOnInit(): void {
    this.addScript();
  }

  addScript(){
    window['grecaptchaCallback'] = (resp)=>{
      console.log("grecaptchaCallback : ", resp);
      this.renderReCaptcha();
    }

    if ($("script#recaptcha-script").length != 0) return;

    $("body").append( $('<script id="recaptcha-script" src="https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit"></script>') );
    console.log("reCaptcha | added script");
  }

  renderReCaptcha(){
    window['grecaptcha'].render(this.reCaptcha.nativeElement, {
      'sitekey' : this.siteKey,
      'callback': (response) => {
        console.log("captcha response : ", response);
        this.challengeResponse = response;
      }
    });
  }

  response() { return this.challengeResponse; }
  
  ngAfterViewInit(): void{
    
  }
}
