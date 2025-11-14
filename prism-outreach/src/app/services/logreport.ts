import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
@Injectable({
  providedIn: 'root'
})
export class LogReportService {

  constructor(private http: HttpClient,private apiService: ApiService) {}
getUsers(): Observable<any> {
  const params = { role_id: '7,20' };
  return this.apiService.post('prismUsers', params);
}
  // getUsers(): Observable<any> {
  //   const params = { role_id: '7,20' };
  //   this.apiService.post('prismUsers', params)
  //       .subscribe({
  //         next: (res) => {     

  //             return res;

  //         },
  //         error: (err) => {
  //           console.error('❌ Dashboard load failed:', err);
  //           alert('Server error. Please try again later.');
  //         }
  //       });

  //   //return this.http.post('/api/prismUsers', params);
  // }

  getLogReport(start_date: string, end_date: string, user_id: number): Observable<any> {
    const params = { start_date, end_date, user_id };
    return this.apiService.post('prismLogbyuserid', params);
  }
}
