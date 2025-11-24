import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiskProfileService {

  constructor(private http: HttpClient) {}

  getRiskProfile(payload: any): Observable<any> {
    return this.http.post('/prismMemberriskprofile', payload);
  }
}
