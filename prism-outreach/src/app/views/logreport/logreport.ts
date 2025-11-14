import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LogReportService } from '../../services/logreport';
declare var $: any;
@Component({
  selector: 'app-logreport',
  imports: [ReactiveFormsModule],
  templateUrl: './logreport.html',
  styleUrl: './logreport.css',
})
export class Logreport implements OnInit {

  logForm!: FormGroup;
  users: any[] = [];
  logList: any[] = [];
  isLoading = false;
  constructor(
    private fb: FormBuilder,
    private reportService: LogReportService
  ) {}

  ngOnInit(): void {
    
    this.initializeForm();
    this.loadUsers();
    this.loadDefaultLog();
  }
 ngAfterViewInit(): void {
  $('.datepicker').datepicker({
      format: 'mm/dd/yyyy',
      autoclose: true,
      todayHighlight: true,
      orientation: 'bottom'
    });
  }
  initializeForm() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.logForm = this.fb.group({
      user_id: [2, Validators.required],
      start_date: [this.formatDate(startDate), Validators.required],
      end_date: [this.formatDate(endDate), Validators.required],
    });
  }
  formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0'); // MM
    const day = String(date.getDate()).padStart(2, '0');        // DD
    const year = date.getFullYear();                            // YYYY
    return `${month}/${day}/${year}`;
  }
  // formatDate(date: Date): string {
  //   return date.toISOString().split('T')[0];
  // }

  loadUsers() {
    this.reportService.getUsers().subscribe((res) => {
      console.log(res);
      this.users = res.data;
    });
  }

  loadDefaultLog() {
    const { start_date, end_date, user_id } = this.logForm.value;
    this.isLoading = true;
    this.reportService.getLogReport(start_date, end_date, user_id).subscribe((res) => {
      this.logList = res.data;
      this.isLoading = false;
    });
    
  }

  onSearch() {
    if (new Date(this.logForm.value.start_date) > new Date(this.logForm.value.end_date)) {
      alert('Start date cannot be after end date');
      return;
    }
    this.isLoading = true;
    const { start_date, end_date, user_id } = this.logForm.value;

    this.reportService.getLogReport(start_date, end_date, user_id).subscribe((res) => {
      this.logList = res.data;
      this.isLoading = false;
    });
  }
}
