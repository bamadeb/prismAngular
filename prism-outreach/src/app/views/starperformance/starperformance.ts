import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-starperformance',
  imports: [],
  templateUrl: './starperformance.html',
  styleUrl: './starperformance.css',
})
export class Starperformance {

    constructor(private http: HttpClient, private router: Router, private auth: AuthService) {
      
    }
}
