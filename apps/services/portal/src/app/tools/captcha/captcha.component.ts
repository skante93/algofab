import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

var $ = window['$'];

@Component({
  selector: 'tools-captcha',
  templateUrl: './captcha.component.html',
  styleUrls: ['./captcha.component.css']
})
export class CaptchaComponent implements OnInit {

  @Input() siteKey: string;

  @ViewChild('reCaptcha', { static: true }) reCaptcha: ElementRef;
  
  challengeResponse: string = null;
  whenRespond: Function = null;
  WhenExpired: Function = null;
  
  constructor() { }

  ngOnInit(): void {
    
  }

  setWhenRespond(func: Function){
    console.log("changed whenRespond!!");
    this.whenRespond = func;
  }

  setWhenExpired(func: Function){
    console.log("changed WhenExpired!!");
    this.WhenExpired = func;
  }

  addScript(){
    window['grecaptchaCallback'] = ()=>{
      //console.log("grecaptchaCallback : ");
      this.renderReCaptcha();
    }

    if ($("script#recaptcha-script").length != 0){ 
      $("script#recaptcha-script").remove();
    };

    $("body").append( $('<script id="recaptcha-script" src="https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit"></script>') );
    //console.log("reCaptcha | added script");
  }

  renderReCaptcha(){
    window['grecaptcha'].render(this.reCaptcha.nativeElement, {
      'sitekey' : this.siteKey,
      'expired-callback': ()=>{
        
        this.challengeResponse = null;
        if (this.WhenExpired != null){
          setTimeout(()=>{
            console.log("calling WhenExpired!!");
            this.WhenExpired();
          },0);
        }
        window['grecaptcha'].reset();
      },
      'callback': (response) => {
        //console.log("captcha response : ", response);
        this.challengeResponse = response;

        if (this.whenRespond != null){
          setTimeout(()=>{
            console.log("calling whenRespond!!");
            this.whenRespond();
          },0);
        }
      }
    });
  }

  response() { return this.challengeResponse; }
  
  ngAfterViewInit(): void{
    this.addScript();
  }
}
