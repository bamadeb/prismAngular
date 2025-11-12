import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service'; 
@Component({
  selector: 'app-fileprocesslogreport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fileprocesslogreport.html',
  styleUrl: './fileprocesslogreport.css',
})

export class Fileprocesslogreport implements OnInit {
  processLogForm!: FormGroup;
  processList: any[] = [];
  logDetails: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.processLogForm = this.fb.group({
      process_type: ['', Validators.required],
      process_list: ['', Validators.required]
    });
  }

  /** 🔹 When process type changes */
  onProcessTypeChange(): void {
    const log_for = this.processLogForm.get('process_type')?.value;
    this.processList = [];
    this.logDetails = [];
    this.processLogForm.get('process_list')?.setValue('');
    //alert(log_for);
    if (!log_for) return;
      //console.log(this.processLogForm.get('process_list')?.value);
    //console.log(this.process_list);
    const getApiData = { log_for: log_for };
      this.apiService.post('prismFileProcesslistByType', getApiData).subscribe({
        next: (res: any) => {
          if (res.statusCode === 200 && res.data?.length > 0) {
            this.processList = res.data;
          } else {
            this.processList = [];
          }

        },
        error: (err) => {
          console.error('Error loading process list', err);
          this.processList = [];

        }
      });    
    // this.apiService.post('get_process_list_by_type', { getApiData })
    //   .pipe(finalize(() => this.isLoading = false))
    //   .subscribe({
    //     next: (res: any) => {
    //       if (res.statusCode === 200 && res.data?.length > 0) {
    //         this.processList = res.data;
    //       } else {
    //         this.processList = [];
    //       }
    //     },
    //     error: (err) => {
    //       console.error('Error loading process list', err);
    //       this.processList = [];
    //     }
    //   });
  }

  /** 🔹 When process session is selected */
  onProcessSelect(): void {
    const session_id = this.processLogForm.get('process_list')?.value;
    this.logDetails = [];

    if (!session_id) return;

    this.isLoading = true;

    this.apiService.post('prismFileProcessLoglistBySession', { session_id })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          if (res.statusCode === 200 && res.data?.length > 0) {
            this.logDetails = res.data;
          } else {
            this.logDetails = [];
          }
        },
        error: (err) => {
          console.error('Error loading log details', err);
          this.logDetails = [];
        }
      });
  }

  /** 🔹 Format date/time same as Django JS version */
  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const month = d.getMonth() + 1;
    return `${month}/${d.getDate()}/${d.getFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
  }
}
