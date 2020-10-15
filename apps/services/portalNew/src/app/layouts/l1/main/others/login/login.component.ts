import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MainService } from "../../../../../tools/services/main";
import { CaptchaComponent } from "../../../../../tools/captcha/captcha.component";
import { Router, ActivatedRoute } from '@angular/router';

const $ = window['$'];

const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

@Component({
    selector: 'main-signin',
    templateUrl: './login.component.html',
    styleUrls : ['./login.component.scss']
})
export class SigninComponent implements OnInit {
    from: string = "signin";
    redirecTo: string;

    constructor(private mainService: MainService, private router: Router, private activatedRoute: ActivatedRoute){}
    ngOnInit(): void {
        console.log("SigninComponent started!!!");
        // this.activatedRoute.queryParams.subscribe(params=>{
        //     console.log("PARMS ARE : ", params);
        //     if ('redirectTo' in params){
        //         console.log("redirecting to ", params['redirectTo'], '...');
        //         this.redirecTo = params['redirectTo'];
        //     }
            
        // })
    }
    ngAfterViewInit(){
    }
    onSubmit(form){
        console.log('form values :', form.value);
        console.log('form valid :', form.valid);
        if (!form.value.login){
            $.notify('Field Login is required');
            return;
        }
        
        if (!form.value.password){
            $.notify('Field Email is required');
            return;
        }
        
        this.mainService.login(form.value.login, form.value.password).subscribe(
            (res)=>{
                $.notify("Login sccessful!", "success");
                this.activatedRoute.queryParams.subscribe(params=>{
                    console.log("PARMS ARE : ", params);
                    if ('redirectTo' in params){
                        console.log("redirecting to ", params['redirectTo'], '...');
                        this.router.navigate(params['redirectTo'].split('/'));
                    }
                    else{
                        this.router.navigate(["store"]);
                    }
                })
                //this.router.navigate(["/store"]);
            }
            ,
            (err)=>{
                console.log("Hey hey : ", err);
                $.notify(err.error.code + ' : ' + err.error.message);
                
            }
            ,
            ()=>{
                console.log("Finally!!");
            }
        )
    }
}


@Component({
    selector: 'main-signup',
    templateUrl: './login.component.html',
    styleUrls : ['./login.component.scss']
})
export class SignupComponent implements OnInit {
    from: string = "signup";
    ready: boolean = false;

    @ViewChild('reCaptcha', {static:false}) reCaptchaContainer : ElementRef;
    @ViewChild('reCaptcha', {static:false}) reCaptcha : CaptchaComponent;

    constructor(private mainService: MainService, private router: Router){}

    ngOnInit(): void {
        console.log("SignupComponent started!!!");

    }

    ngAfterViewInit(){
        
        console.log("recapcha equals : ", this.reCaptcha.response() );
        // this.reCaptcha.setWhenRespond(()=>{ this.readyToGo() } );
        // this.reCaptcha.setWhenExpired(()=>{ this.readyToGo() } );
        setInterval(()=>{ this.ready = !this.ready; },2000);
    }

    readyToGo(form): void {
        if (this.reCaptcha == null){
            this.ready = false;
            return;
        }
        else if(this.reCaptcha.response() == null){
            this.ready = false;
            return;
        }

        
        //console.log("readyToGo called!!", form.value);
        //console.log("READY WAS : ", this.ready);
        //console.log("this.reCaptcha.response() :", this.reCaptcha);
        this.ready = true;
        //console.log("READY IS : ", this.ready);
    }

    onSubmit(form){
        //console.log('form values :', form.value);
        //console.log('form valid :', form.valid);
        
        if (!form.value.username){
            $.notify('Field username is required');
            return;
        }
        
        if (!form.value.email){
            $.notify('Field Email is required');
            return;
        }
        else if (!emailRegExp.test(form.value.email)){
            $.notify(`Field Email expects an email, which ${form.value.email} is not.`);
            return;
        }

        this.mainService.createAPIObject({
            kind: 'user', 
            body: form.value
        }).subscribe(
            (res)=>{
                $.notify("Successfully signed up! Check your email for futrther information", "success");
                this.router.navigate(["/signin"]);
            }
            ,
            (err)=>{
                console.log("Hey hey : ", err);
                $.notify(err.error.code + ' : ' + err.error.message);
                
            }
            ,
            ()=>{
                console.log("Finally!!");
            }
        )
    }
}

@Component({
    selector: 'main-signout',
    template: '',
    styleUrls : ['./login.component.scss']
})
export class SignoutComponent implements OnInit {
    constructor(private mainService: MainService, private router: Router){}
    ngOnInit(): void {
        console.log("SigninComponent started!!!");
        this.mainService.logout();
        $.notify('Successfully logged out', 'success');
        this.router.navigate(['store']);
    }
}