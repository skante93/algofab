
import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Router, ActivatedRoute } from '@angular/router';

import { Observable } from 'rxjs';

//import { ToolsModule } from '../tools.module';


import { APP_SETTINGS } from './settings';

var isAPIKind = (kind)=> {
    if (['user', 'resource', 'licence', 'agreement', 'rating', 'algotemplate', 'algoinstance'].indexOf(kind) >=0 ){
        kind = kind+'s';
    }
    else if (['users', 'resources', 'licences', 'agreements', 'ratings', 'algotemplates', 'algoinstances'].indexOf(kind) < 0 ){
        throw new Error(`API Kind "${kind}" is incorrect`);
    }
    return kind;
}

export interface CallOptions {
    kind: 'user' | 'users' | 'resource' | 'resources' | 'licence' | 'licences' | 'agreement' | 'agreements' | 'rating' | 'ratings' | 'algotemplate' | 'algotemplates' | 'algoinstance' | 'algoinstances',
    objectID?: string,
    requestedBy?: string,
    subUrl?: string,
    body?: FormData | Object,
    query?: Object,
    isMultipart?: boolean 
}

function requestOptions(options : CallOptions){
    options.kind = isAPIKind( options.kind.trim().toLocaleLowerCase() );

    if (options.query){
        options.query = '?' + (<any>Object).entries(options.query).map(entry => {
            if (entry[1] instanceof Array){
                return entry[1].map(e=> entry[0] + '=' + e).join('&');
            }
            else {
                return entry[0] + '=' + entry[1];
            }
        }).join('&');
    }
    else{
        options.query = '';
    }

    
    let call_url , body, call_options:any = {};
    
    call_url = APP_SETTINGS.apiServerAddress + '/' + options.kind + (options.objectID ? '/' + options.objectID: '') +(options.subUrl? '/'+options.subUrl:'') + options.query;

    if (options.requestedBy){
        call_options.headers = {};
        call_options.headers['X-API-KEY'] = options.requestedBy;
    }
    
    if (options.kind == 'resources' && (options.subUrl === 'archive' || options.subUrl === 'docs')){
        call_options.responseType = 'arraybuffer';
    }

    if (options.body instanceof FormData || options.isMultipart === true){
        //
        console.log("#################### MULTIPART ASUMED")
        if ( options.body instanceof FormData ){
            console.log("#################### WAS INDEED FROMDATA")
            body = options.body;
        }
        else{
            body = new FormData();
            for (var b in options.body){
                body.append(b, options.body[b]);
            }
        }
    }
    else{
        body = options.body;
    }

    return [call_url, body, call_options];
}

@Injectable({
    providedIn: 'root'
})
export class MainService implements OnInit{
    
  

    userAccount: any = null;

    constructor(private http: HttpClient, private acitvatedRoute: ActivatedRoute) {
        this.updateActiveAccount();
    }

    ngOnInit(): void {
        
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

    updateActiveAccount(account: any = null){
        //
        //console.log("updating useracoount..");
        if (account == null){
            //console.log("no account provided whatso ever trying to fetch from sessionstore");
            var u = localStorage.getItem('userAccount');
            if (u != null) {
                this.userAccount = JSON.parse(u);
            }
        }
        else{
            //console.log("Gotten a user account, updating it.");
            this.userAccount = Object.assign({}, account);
            localStorage.setItem('userAccount', JSON.stringify(this.userAccount));
        }
    }

    login(userID: string, password: string){
        const call_url = APP_SETTINGS.apiServerAddress+'/users/login';
        const body = { login: userID, password: password };
        console.log("Logging in, [", call_url, ']');

        return new Observable(observale =>{
            this.http.post(call_url, body).subscribe( 
                // Success
                (res: any)=>{
                    // console.log("[MAIN SERVICE HTTP CALLBACK] Login succeeded, response :", res);
                    // console.log('res.response : ', res.response);
                    this.updateActiveAccount(res.response);
                    // localStorage.setItem("user", JSON.stringify(res.body));
                    observale.next(res);
                },
                // Error
                err => {
                    //console.log("[MAIN SERVICE HTTP CALLBACK] err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ 
                    // console.log("[MAIN SERVICE HTTP CALLBACK] Done logging in !!"); observale.complete(); 
                }
            );
        });
    }

    logout(){
        localStorage.removeItem('userAccount');
        this.userAccount = null;
    }

    isLoggedIn(): boolean {
        //console.log("[MAIN SERVICE] IS LOGGED IN? ", this.userAccount);
        return this.userAccount != null;
    }

    getUserAccount () { return this.userAccount; }

    getAPIObject(options:CallOptions): Observable<any>{
        // objectKind: string, 
        // objectID: string = null, 
        // options: any = null
        console.log("### GETAPIOBJECT CALLED ###");
        // options.kind = isAPIKind( options.kind.trim().toLocaleLowerCase() );

        // if (options.query){
        //     options.query = '?' + (<any>Object).entries(options.query).map(entry => {
        //         if (entry[1] instanceof Array){
        //             return entry[1].map(e=> entry[0] + '=' + e).join('&');
        //         }
        //         else {
        //             return entry[0] + '=' + entry[1];
        //         }
        //     }).join('&');
        // }
        // else{
        //     options.query = '';
        // }

        
        // let call_url , call_options:any = {};
        
        // call_url = APP_SETTINGS.apiServerAddress + '/' + options.kind + (options.objectID ? '/' + options.objectID: '') +(options.subUrl? '/'+options.subUrl:'') + options.query;

        // if (options.author){
        //     call_options.headers = {};
        //     call_options.headers['X-API-KEY'] = options.author;
        // }

        
        
        var ro = requestOptions(options);
        
        

        console.log("######### call_url : ", ro[0]);

        console.log("######### HEADER : ", ro[2]);

        return new Observable(observale =>{
            this.http.get(ro[0], ro[2]).subscribe(
                // Success
                (res: any)=>{
                    //console.log(`[MAIN SERVICE HTTP CALLBACK] Getting ${options.kind} ${options.objectID == null? '' : options.objectID+' '}succeeded, response :`, res);
                    observale.next(res);
                },
                // Error
                err => {
                    //console.log("[MAIN SERVICE HTTP CALLBACK] err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ 
                    //console.log(`[MAIN SERVICE HTTP CALLBACK] Done getting ${options.kind} ${options.objectID == null? '' : options.objectID}`); 
                    observale.complete(); 
                }
            );
        });
    }

    // createUserAccount(info: any){
    //     const call_url = APP_SETTINGS.apiServerAddress + '/users';
    //     const body = info;
    //     return new Observable(observale =>{
    //         this.http.post(call_url, body).subscribe(
    //             // Success
    //             (res: any)=>{
    //                 console.log(`[MAIN SERVICE HTTP CALLBACK] Created user account successfully : `, res);
    //                 observale.next(res);
    //             },
    //             // Error
    //             err => {
    //                 console.log("err : ", err);
    //                 observale.error(err);
    //             }, 
    //             // Done
    //             ()=>{ console.log(`[MAIN SERVICE HTTP CALLBACK] Done creating user account`); observale.complete(); }
    //         );
    //     });
    // }

    createAPIObject(options:CallOptions){
        //objectKind: string, 
        //info: any, 
        //author: string = null, 
        //options: any = null, 
        //isMultipart:boolean= false
        
        
        /*
        console.log("### CREATEAPIOBJECT CALLED ###");
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

        const call_url = APP_SETTINGS.apiServerAddress + ('/'+kind) + query;
        
        var headers = {'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json'};
        
        if (author != null){
            headers['X-API-KEY'] = author
        }

        let body;
        if (isMultipart == true){
            body = new FormData();
            for (let i in info){ body.append(i,info[i]) }
        }
        else{
            body = info;
        }

        console.log("######### HEADER : ", headers);
        
        console.log("######### body : ", body);
        */
        
        // options.kind = isAPIKind( options.kind.trim().toLocaleLowerCase() );

        // if (options.query){
        //     options.query = '?' + (<any>Object).entries(options.query).map(entry => {
        //         if (entry[1] instanceof Array){
        //             return entry[1].map(e=> entry[0] + '=' + e).join('&');
        //         }
        //         else {
        //             return entry[0] + '=' + entry[1];
        //         }
        //     }).join('&');
        // }
        // else{
        //     options.query = '';
        // }

        
        // let call_url , headers : any ={}, body;
        
        // call_url = APP_SETTINGS.apiServerAddress + '/' + options.kind + (options.objectID? '/' + options.objectID:'') +(options.subUrl? '/'+options.subUrl:'') + options.query;

        // if (options.author){
        //     headers['X-API-KEY'] = options.author;
        // }

        // if (options.body instanceof FormData || options.isMultipart === true){
        //     //
        //     console.log("#################### MULTIPART ASUMED")
        //     if ( options.body instanceof FormData ){
        //         console.log("#################### WAS INDEED FROMDATA")
        //         body = options.body;
        //     }
        //     else{
        //         body = new  FormData();
        //         for (var b in options.body){
        //             body.append(b, options.body[b]);
        //         }
        //     }
        // }
        // else{
        //     body = options.body;
        // }
        
        var ro = requestOptions(options);

        console.log("######### call_url : ", ro[0]);

        console.log("######### HEADER : ", ro[2]);
        
        console.log("######### body : ", ro[1]);

        return new Observable(observale =>{
            this.http.post(ro[0], ro[1], ro[2]).subscribe(
                // Success
                (res: any)=>{
                    console.log(`[MAIN SERVICE HTTP CALLBACK] Created ${options.kind} successfully : `, res);
                    observale.next(res);
                },
                // Error
                err => {
                    console.log("err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ console.log(`[MAIN SERVICE HTTP CALLBACK] Done creating ${options.kind}`); observale.complete(); }
            );
        });
    }

    updateAPIObject(options:CallOptions){
        // objectKind: string, 
        // objectID: string, 
        // info: any, 
        // author: string = null, 
        // options: any = null, 
        // isMultipart:boolean= false
        
        console.log("### UPDATEAPIOBJECT CALLED ###");
        
        var ro = requestOptions(options);
        
        console.log("######### call_url : ", ro[0]);

        console.log("######### HEADER : ", ro[2]);
        
        console.log("######### body : ", ro[1]);

        return new Observable(observale =>{
            this.http.put(ro[0], ro[1], ro[2]).subscribe(
                // Success
                (res: any)=>{
                    // console.log(`[MAIN SERVICE HTTP CALLBACK] Updated ${options.kind} successfully : `, res);
                    if (options.kind == 'users' && options.objectID === this.userAccount._id){
                        this.updateActiveAccount(res.response);
                    }
                    observale.next(res);
                },
                // Error
                err => {
                    // console.log("err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ 
                    // console.log(`[MAIN SERVICE HTTP CALLBACK] Done creating ${options.kind}`); observale.complete(); 
                }
            );
        });
    }
    removeAPIObject(options:CallOptions){
        // objectKind: string, 
        // objectID: string, 
        // info: any, 
        // author: string = null, 
        // options: any = null, 
        // isMultipart:boolean= false
        
        console.log("### UPDATEAPIOBJECT CALLED ###");
        // console.log("body : ", options.body);
        
        // options.kind = isAPIKind( options.kind.trim().toLocaleLowerCase() );

        // if (options.query){
        //     options.query = '?' + (<any>Object).entries(options.query).map(entry => {
        //         if (entry[1] instanceof Array){
        //             return entry[1].map(e=> entry[0] + '=' + e).join('&');
        //         }
        //         else {
        //             return entry[0] + '=' + entry[1];
        //         }
        //     }).join('&');
        // }
        // else{
        //     options.query = '';
        // }

        
        // let call_url , headers : any ={}, body;
        
        // call_url = APP_SETTINGS.apiServerAddress + '/' + options.kind + '/' + options.objectID +(options.subUrl? '/'+options.subUrl:'') + options.query;

        // if (options.author){
        //     headers['X-API-KEY'] = options.author;
        // }

        // if (options.body instanceof FormData || options.isMultipart === true){
        //     //
        //     console.log("#################### MULTIPART ASUMED")
        //     if ( options.body instanceof FormData ){
        //         console.log("#################### WAS INDEED FROMDATA")
        //         body = options.body;
        //     }
        //     else{
        //         body = new  FormData();
        //         for (var b in options.body){
        //             body.append(b, options.body[b]);
        //         }
        //     }
        // }
        // else{
        //     body = options.body;
        // }

        var ro = requestOptions(options);

        console.log("######### call_url : ", ro[0]);

        console.log("######### HEADER : ", ro[2]);
        
        console.log("######### body : ", ro[1]);

        return new Observable(observale =>{
            this.http.delete(ro[0], ro[2]).subscribe(
                // Success
                (res: any)=>{
                    // console.log(`[MAIN SERVICE HTTP CALLBACK] Updated ${options.kind} successfully : `, res);
                    if (options.kind == 'users' && options.objectID === this.userAccount._id){
                        this.logout();
                    }
                    observale.next(res);
                },
                // Error
                err => {
                    // console.log("err : ", err);
                    observale.error(err);
                }, 
                // Done
                ()=>{ 
                    // console.log(`[MAIN SERVICE HTTP CALLBACK] Done creating ${options.kind}`); observale.complete(); 
                }
            );
        });
    }
}
