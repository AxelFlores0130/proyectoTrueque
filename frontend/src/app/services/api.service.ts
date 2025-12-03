import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({providedIn:'root'})
export class ApiService{
  base = environment.apiUrl;
  constructor(private http:HttpClient){}
  get(path:string, params?:any){return this.http.get(this.base+path,{params});}
  post(path:string, body:any){return this.http.post(this.base+path, body);}
}
