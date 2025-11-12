import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://e9vakopr4c.execute-api.us-east-1.amazonaws.com/dev'; // set your API base URL
  private env = 'dev'
  constructor(private http: HttpClient) {}

  // Generic POST API call
  post<T>(endpoint: string, payload: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}-${this.env}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<T>(url, payload, { headers }).pipe(
      catchError((error) => {
        console.error('❌ API Error:', error);
        return throwError(() => error);
      })
    );
  }

  // (Optional) GET method
  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.get<T>(url, { params }).pipe(
      catchError((error) => {
        console.error('❌ API Error:', error);
        return throwError(() => error);
      })
    );
  }
}
