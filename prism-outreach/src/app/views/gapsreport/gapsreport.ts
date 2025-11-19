import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GapsReportService } from '../../services/gapsreport';
import { take } from 'rxjs/operators';

declare var $: any;

@Component({
  selector: 'app-gapsreport',
  standalone: true,
  imports: [ 
    ReactiveFormsModule 
  ],
  templateUrl: './gapsreport.html',
  styleUrls: ['./gapsreport.css']
})
export class GapsReportComponent implements OnInit { 
  gapsForm!: FormGroup;
  dt: any;  
  gapsData: any[] = []; 
  isLoading = false;
 constructor(
    private fb: FormBuilder,
    private reportService: GapsReportService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
    this.initializeForm(); 
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
        this.gapsForm.get(controlName)?.patchValue(e.format());
      }
    });
  } 

  formatDataForDT(data: any[]) {
    return data.map(item => [
      item.medicaid_id,
      item.TYPE,
      item.DIAG_CODE,
      item.DIAG_DESC,      
      item.ObservationDate !== '01/01/1900' ? item.ObservationDate  : '',
      item.Observation_Year,
      item.Observation_Code,
      item.CPT_Code_Modifier,
      item.Observation_Code_Set,
      item.Observation_Result,
      item.Service_Provider_NPI,
      item.Service_Provider_Taxonomy_Code,
      item.Service_Provider_Name,
      item.Service_Provider_Type,
      item.Service_Provider_RxProviderFlag,
      item.Provider_Group_NPI,
      item.Provider_Group_Taxonomy_Code,
      item.Provider_Group_Name,
      item.Source
    ]);
}

 initializeForm() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.gapsForm = this.fb.group({ 
      start_date: [this.formatDate(startDate), Validators.required],
      end_date: [this.formatDate(endDate), Validators.required],
    });
  }

  formatDate(date: Date): string {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }

  

  loadDefaultLog() { 
  const { start_date, end_date } = this.gapsForm.value;
  this.isLoading = true;
  this.reportService.getLogReport(start_date, end_date).subscribe((res) => {
  this.gapsData = res.data;
  //console.log('console: '+this.gapsData);

    setTimeout(() => {
      this.dt = $('#gaps').DataTable({
        data: this.formatDataForDT(this.gapsData),
        columns: [
          { title: "MEDICAID ID" },
          { title: "TYPE" },
          { title: "DIAG CODE" },
          { title: "DIAG DESC" },
          { title: "Observation Date" },
          { title: "Observation Year" },
          { title: "Observation Code" },
          { title: "CPT Modifier" },
          { title: "Code Set" },
          { title: "Result" },
          { title: "Provider NPI" },
          { title: "Taxonomy Code" },
          { title: "Provider Name" },
          { title: "Provider Type" },
          { title: "RxProviderFlag" },
          { title: "Group NPI" },
          { title: "Group Taxonomy" },
          { title: "Group Name" },
          { title: "Source" }
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

   
  onSearch() {
  const { start_date, end_date } = this.gapsForm.value;

  if (new Date(start_date) > new Date(end_date)) {
    alert('Start date cannot be after end date');
    return;
  }

  this.isLoading = true;
  console.log(start_date+'===='+end_date);
  this.reportService.getLogReport(start_date, end_date).subscribe(res => {
    this.gapsData = res.data;
    console.log(this.gapsData);
    const rows = this.formatDataForDT(this.gapsData);

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

  /** CSV DOWNLOAD */

  downloadCsv() {
  if (!this.gapsData.length) {
    alert('No data available to download.');
    return;
  }

  // ---------------------------------------------
  // 1) FIRST API DATA (existing: this.gapsData)
  // ---------------------------------------------
  const api1Data = this.gapsData;

  // Custom CSV header (NOT object keys)
  const header = [
    'MEMBER ID',
    'PATIENT MEMBER ID',
    'PATIENT CMS MEDICARE NUMBER',
    'MEMBER FIRST NAME',
    'MEMBER LAST NAME',
    'MEMBER DOB',
    'OBSERVATION DATE',
    'OBSERVATION YEAR',
    'OBSERVATION CODE',
    'CPT CODE MODIFIER',
    'OBSERVATION CODE SET',
    'OBSERVATION RESULT',
    'SERVICE PROVIDER NPI',
    'SERVICE PROVIDER TAXONOMY CODE',
    'SERVICE PROVIDER NAME',
    'SERVICE PROVIDER TYPE',
    'SERVICE PROVIDER RXPROVIDERFLAG',
    'PROVIDER GROUP NPI',
    'PROVIDER GROUP TAXONOMY CODE',
    'PROVIDER GROUP NAME',
    'SOURCE'
  ];

  // Convert API1 data to CSV rows using your header
  const rows1 = api1Data.map(item => [
    item.RECIP_NO ?? '',
    item.RECIP_NO ?? '',
    item.MEDICARE_NO ?? '',
    item.FIRST_NAME ?? '',
    item.LAST_NAME ?? '',
    item.BIRTH ?? '', 
    item.ObservationDate !== '01/01/1900' ? item.ObservationDate  : '',
    item.Observation_Year ?? '',
    item.Observation_Code ?? '',
    item.CPT_Code_Modifier ?? '',
    item.Observation_Code_Set ?? '',
    item.Observation_Result ?? '',
    item.Service_Provider_NPI ?? '',
    item.Service_Provider_Taxonomy_Code ?? '',
    item.Service_Provider_Name ?? '',
    item.Service_Provider_Type ?? '',
    item.Service_Provider_RxProviderFlag ?? '',
    item.Provider_Group_NPI ?? '',
    item.Provider_Group_Taxonomy_Code ?? '',
    item.Provider_Group_Name ?? '',
    item.Source ?? ''
  ].map(v => v.toString().replace(/\|/g, ' ')).join('|')); 

    // ---------------------------------------------
    // 3) MERGE BOTH API DATASETS INTO CSV
    // ---------------------------------------------
    const csvRows = [
      header.join('|'),
      ...rows1 
    ];

    // ---------------------------------------------
    // 4) FILENAME
    // ---------------------------------------------
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const filename = `RISK_GAPS_CIH_(${mm}-${dd}-${yyyy}).CSV`;

    // ---------------------------------------------
    // 5) DOWNLOAD CSV
    // ---------------------------------------------
    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
 
}

  
}