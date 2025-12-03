import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  // change to your server address
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  // returns observable of HttpEvent to track progress
  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    // Use HttpRequest for progress events
    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  // optional: fetch list of files
  getFiles() {
    return this.http.get(`${this.baseUrl}/files`);
  }
}
