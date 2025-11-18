import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LogReportService } from '../../services/logreport';
import { take } from 'rxjs/operators';

declare var $: any;

@Component({
  selector: 'app-logreport',
  imports: [ReactiveFormsModule],
  templateUrl: './logreport.html',
  styleUrl: './logreport.css',
})
export class Logreport implements OnInit {
  dt: any;
  logForm!: FormGroup;
  users: any[] = [];
  logList: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private reportService: LogReportService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
    }).on('changeDate', (e: any) => {  
      
      const input = e.target as HTMLInputElement;
      const controlName = input.getAttribute('formControlName'); 
      if (controlName) {
        this.logForm.get(controlName)?.patchValue(e.format());
      }

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
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }

  loadUsers() {
    this.reportService.getUsers().subscribe((res) => {
      this.users = res.data;
    });
  }

  loadDefaultLog() {
  const { start_date, end_date, user_id } = this.logForm.value;
  this.isLoading = true;

  this.reportService.getLogReport(start_date, end_date, user_id).subscribe((res) => {

    this.logList = res.data;

    setTimeout(() => {
      this.dt = $('#logreport').DataTable({
        data: this.formatDataForDT(this.logList),
        columns: [
          { title: "MEDICAID ID" },
          { title: "ACTIVITY CATEGORY" },
          { title: "ACTIVITY TYPE" },
          { title: "ACTION RESULT" },
          { title: "ACTION STATUS" },
          { title: "ACTION DATE" },
          { title: "NOTE" }
        ],
        dom: '<"d-flex justify-content-between align-items-center"lf>t<"d-flex justify-content-between"ip>',
        language: {
          search: "_INPUT_",
          searchPlaceholder: "Search"
        },
        columnDefs: [{ orderable: false, targets: 0 }]
      });
    }, 300);

    this.isLoading = false;
  });
}

formatDataForDT(data: any[]) {
  return data.map(item => [
    item.medicaid_id,
    item.Panel_Name,
    item.action_type,
    item.action_result,
    item.action_status,
    item.action_date !== '01/01/1900' ? item.action_date : '',
    item.action_note
  ]);
}


  private initializeDataTable(selector: string, disableFirstColumnSort: boolean = false): void {
    const table = $(selector);

    if ($.fn.DataTable.isDataTable(table)) {
      table.DataTable().destroy();
    }

    const config: any = {
      dom: '<"d-flex justify-content-between align-items-center"lf>t<"d-flex justify-content-between"ip>',
      language: {
        search: "_INPUT_",
        searchPlaceholder: "Search",
      },
    };

    if (disableFirstColumnSort) {
      config.columnDefs = [{ orderable: false, targets: 0 }];
    }

    table.DataTable(config);
  }

 onSearch() {
  const { start_date, end_date, user_id } = this.logForm.value;

  if (new Date(start_date) > new Date(end_date)) {
    alert('Start date cannot be after end date');
    return;
  }

  this.isLoading = true;

  this.reportService.getLogReport(start_date, end_date, user_id).subscribe(res => {

    this.logList = res.data;
    const rows = this.formatDataForDT(this.logList);

    setTimeout(() => {
      if (this.dt) {
        this.dt.clear();
        this.dt.rows.add(rows);
        this.dt.draw();
      }
    }, 100);

    this.isLoading = false;
  });
}


}
