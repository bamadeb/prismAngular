import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse  } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl; // set your API base URL
  private env = environment.env
  
    constructor(private http: HttpClient) {}
post<T>(endpoint: string, payload: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}-${this.env}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<T>(url, payload, { headers, observe: 'response' }).pipe(
      tap((response: HttpResponse<T>) => {
        console.log('✅ POST URL:', url);
        console.log('✅ POST Headers:', response.headers.keys().map(key => `${key}: ${response.headers.get(key)}`));
      }),
      map((response: HttpResponse<T>) => response.body as T),
      catchError(err => {
        console.error('❌ POST Error:', err);
        return throwError(() => err);
      })
    );
  }

    get<T>(endpoint: string): Observable<T> {
      const url = `${this.baseUrl}/${endpoint}-${this.env}`;
      return this.http.get<T>(url).pipe(
        catchError(err => throwError(() => err))
      );
    }
 
}
