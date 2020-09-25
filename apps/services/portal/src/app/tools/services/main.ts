
import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Router, ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs';

//import { ToolsModule } from '../tools.module';


import * as APP_SETTINGS from './settings.json';

var isAPIKind = (kind)=> {
    if (['user', 'resource', 'algotemplate', 'algoinstance'].indexOf(kind) >=0 ){
        kind = kind+'s';
    }
    else if (['user', 'resource', 'algotemplate', 'algoinstance'].indexOf(kind) < 0 ){
        throw new Error(`API Kind "${kind}" is incorrect`);
    }
    return kind;
}

@Injectable({
    providedIn: 'root'
})
export class MainService implements OnInit{
  

    userAccount: any = null;

    constructor(private http: HttpClient, private router : Router,  private acitvatedRoute: ActivatedRoute) {
        
    }

    ngOnInit(): void {
        this.updateUserAccount();
    }

    showSettings(): void {
        console.log(" APP_SETTINGS : ", JSON.stringify(APP_SETTINGS.apiServerAddress, null, 2));
    }

    getRenderingTexts(texts: Array<string>){
        var reqested_values = {};
        var default_lang: string = APP_SETTINGS.default_lang;
        
        return new Observable(observale =>{
            this.acitvatedRoute.queryParams.subscribe( params => {
                
                var lang: string = ("lang" in params) ? params["lang"] : default_lang;
                texts.forEach((t)=>{
                    if (t in APP_SETTINGS.texts) {
                        reqested_values[t] = (lang in APP_SETTINGS.texts[t])? APP_SETTINGS.texts[t][lang] : (default_lang in APP_SETTINGS.texts[t])? APP_SETTINGS.texts[t][default_lang] : null;
                    }
                });
                observale.next(reqested_values);
                observale.complete();
            });
        });
    }

    updateUserAccount(account: any = null){
        //
        if (account == null){
            var u = sessionStorage.getItem('userAccount');
            if (u != null) {
                this.userAccount = JSON.parse(u);
            }
        }
        else{
            Object.assign(this.userAccount, account);
            sessionStorage.setItem('userAccount', JSON.stringify(this.userAccount));
        }
    }

    login(userID: string, password: string){
        const call_url = APP_SETTINGS.apiServerAddress+'/users/'+userID+'/login';
        const body = { password: password };
        console.log("Logging in, [", call_url, ']');

        return new Observable(observale =>{
            this.http.post(call_url, body).subscribe( 
                // Success
                (res: any)=>{
                    console.log("[MAIN SERVICE HTTP CALLBACK] Login succeeded, response :", res);
                    this.updateUserAccount(res.body);
                    //sessionStorage.setItem("user", JSON.stringify(res.body));
                    observale.next(res);
                },
                // Error
                err => {
                    console.log("[MAIN SERVICE HTTP CALLBACK] err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ console.log("[MAIN SERVICE HTTP CALLBACK] Done logging in !!"); observale.complete(); }
            );
        });
    }

    logout(){
        sessionStorage.removeItem('userAccount');
        this.userAccount = null;
    }

    isLoggedIn(): boolean {
        return this.userAccount != null;
    }

    getUserAccount () { return this.userAccount; }

    getAPIObject(objectKind: string, objectID: string = null, options: any = null){
        var kind = objectKind.trim().toLocaleLowerCase();
        kind = isAPIKind(kind);

        const query: string = options == null ? '' : '?'+(<any>Object).entries(options).map(entry => {
            if (entry[1] instanceof Array){
                return entry[1].map(e=> entry[0] + '=' + e).join('&');
            }
            else {
                return entry[0] + '=' + entry[1];
            }
        }).join('&');

        const call_url = APP_SETTINGS.apiServerAddress + ('/'+kind) + (objectID == null ? '' : '/'+objectID) + query;
        
        console.log("Getting users [", call_url, "]...");
        
        return new Observable(observale =>{
            this.http.get(call_url).subscribe(
                // Success
                (res: any)=>{
                    console.log(`[MAIN SERVICE HTTP CALLBACK] Getting ${kind} ${objectID == null? '' : objectID+' '}succeeded, response :`, res);
                    observale.next(res);
                },
                // Error
                err => {
                    console.log("[MAIN SERVICE HTTP CALLBACK] err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ console.log(`[MAIN SERVICE HTTP CALLBACK] Done getting ${kind} ${objectID == null? '' : objectID}`); observale.complete(); }
            );
        });
    }

    createUserAccount(info: any){
        const call_url = APP_SETTINGS.apiServerAddress + '/users';
        const body = info;
        return new Observable(observale =>{
            this.http.post(call_url, body).subscribe(
                // Success
                (res: any)=>{
                    console.log(`[MAIN SERVICE HTTP CALLBACK] Created user account successfully : `, res);
                    observale.next(res);
                },
                // Error
                err => {
                    console.log("err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ console.log(`[MAIN SERVICE HTTP CALLBACK] Done creating user account`); observale.complete(); }
            );
        });
    }
}
