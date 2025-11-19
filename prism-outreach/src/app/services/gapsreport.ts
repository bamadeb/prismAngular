import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
@Injectable({
  providedIn: 'root'
})
export class GapsReportService {

  constructor(private http: HttpClient,private apiService: ApiService) {} 

  getLogReport(start_date: string, end_date: string): Observable<any> {
    const params = { start_date, end_date };
    return this.apiService.post('prismGetgapsobservationdata', params);
  }

  //prismGetgapsobservationdata
}
