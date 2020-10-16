import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

var apiServerAddress = "http://localhost:9313";

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  

  user: any = null;

  constructor(private http: HttpClient) {
  }

  getAllResources() {
    return this.http.get(apiServerAddress+'/resources');
  }

  getResource(id) {
    return this.http.get(apiServerAddress+'/resources/'+id);
  }
}
