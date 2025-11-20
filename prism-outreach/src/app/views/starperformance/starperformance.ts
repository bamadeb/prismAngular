import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-starperformance',
  imports: [CommonModule],
  templateUrl: './starperformance.html',
  styleUrl: './starperformance.css',
})
export class Starperformance {
  isLoading = false;
  starReportList: any[] = [];
    constructor(private apiService: ApiService,private http: HttpClient, private router: Router, private auth: AuthService) {
      
    }
  ngOnInit(): void {
    this.loadStarPerformanceReport(2024);
  }

    loadStarPerformanceReport(year: number){
      this.isLoading = true;
      const apiPayload = {
          year: year
        };
        this.apiService.post('prismGetStarPerformanceByYear', apiPayload).subscribe({
            next: (res: any) => {
              //console.log('✅ Data inserted:', res);
              this.starReportList = res.data;
              //alert('Action saved successfully!');
              //console.log(this.starReportList);
              this.isLoading = false;
            },
            error: (err) => {
              console.error('❌ Error inserting action:', err);
              alert('Failed to save action!');
            },
        });
    }
}
