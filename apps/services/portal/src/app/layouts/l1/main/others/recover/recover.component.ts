import { Component } from "@angular/core";
import { MainService } from "../../../../../tools/services/main";
import { Router, ActivatedRoute } from "@angular/router";

const $ = window['$'];

@Component({
    selector: 'recover',
    templateUrl: 'recover.component.html',
    styleUrls: ['./recover.component.scss']
})
export class RecoverComponent {
    recoverID: string;
    errMsg: string; 
    ready: boolean = false;

    constructor (private router: Router, private activatedRoute: ActivatedRoute, private mainService : MainService){}

    ngOnInit(){
        console.log("RecoverComponent started!!");
        //alert("RecoverComponent started!!");
        this.activatedRoute.queryParams.subscribe(query=>{
            if ('recoverID' in query){
                this.recoverID = query.recoverID;
                
                this.mainService.getAPIObject({
                    kind: "user",
                    subUrl: "recover",
                    query: {
                        recoverID: this.recoverID
                    }
                }).subscribe(
                    (res)=>{
                        //$.notify("Success! Check your email for further instructions.", "success");
                        this.ready = true;
                    }, 
                    (err)=>{ this.errMsg = err.error.message; $.notify(err.error.message); this.ready = true;}
                );
            }
            else{
                this.ready = true;
            }
        });
    }

    onRecoverFormSubmit(form) {
        console.log("form : ", form.email);

        if (!form.value.email){
            return $.notify("Email is required");
        }
        if (!form.value.recover){
            return $.notify("Recover is required");
        }

        this.mainService.getAPIObject({
            kind: "user",
            subUrl: "recover",
            query: {
                email: form.value.email,
                recover: form.value.recover
            }
        }).subscribe(
            (res)=>{
                $.notify("Success! Check your email for further instructions.", "success");
            }, 
            (err)=>{ $.notify(err.error.message); }
        );
    }

    onNewPasswordFormSubmit(form) {
        console.log("form : ", form.password);

        if (!form.value.password){
            return $.notify("Password is required");
        }

        this.mainService.getAPIObject({
            kind: "user",
            subUrl: "recover",
            query: {
                password: form.value.password,
                recoverID: this.recoverID
            }
        }).subscribe(
            (res)=>{
                $.notify("Success! you can login using the new password.", "success");
                this.router.navigate(['signin']);
            }, 
            (err)=>{ $.notify(err.error.message); }
        );
    }
}