import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

var apiServerAddress = "http://localhost:9313";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  

  user: any = null;

  constructor(private http: HttpClient) {
    //console.log("AUTH SERVICE STARTED!!!");
    var u = sessionStorage.getItem('user');
    if (u != null) this.user = JSON.parse(u);
    //console.log("user : ", this.user);
  }

  login(userID: string, password: string){
    console.log("Logging in, [", apiServerAddress+'/users/'+userID+'/login', ']');
    return new Promise((resolve, reject)=>{
      this.http.post(apiServerAddress+'/users/'+userID+'/login', {password: password, expiredPasswordOK: true}).subscribe( 
        // Success
        (res: any)=>{
          console.log("Login succeeded, response :", res);
          this.user = res.body;
          sessionStorage.setItem("user", JSON.stringify(res.body));
          resolve(res.body)
        }, 
        // Error
        err => {
          console.log("err : ", err);
          reject(err);
        }, 
        // Done
        ()=>{ console.log("Done!!"); }
      );
    });
  }

  logout(){
    this.user = null;
    sessionStorage.removeItem('user');
  }

  loggedIn(): boolean {
	  return this.user != null;
  }

  getUser () { return this.user;}

  getUsers(){
    console.log("Getting users...");
    this.http.get(apiServerAddress+'/users').subscribe( (resp: any) => { 
      console.log("HTTP RESPONSE : ", resp);
    });
  }
}
