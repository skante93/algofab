import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
    console.log("AUTH SERVICE STARTED!!!");
    this.getUsers();
  }

  login(username: string, password: string){
    console.log("Logging in");
  }

  getUsers(){
    console.log("Getting users...");
    var a = this.http.get('http://localhost:9313/users');

    setInterval(()=>{console.log("a: ", a);}, 2000);
  }
}
