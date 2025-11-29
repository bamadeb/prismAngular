import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { ApiService } from '../../services/api.service'; // adjust path
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import * as Papa from 'papaparse';
import { AfterViewInit } from '@angular/core';
declare var $: any;
@Component({
   selector: 'app-process-cih-pcr',
  standalone: true, // ✅ Add this
  imports: [CommonModule, ReactiveFormsModule], // ✅ Fix: import modules here
  templateUrl: './process-cih-pcr.html',
  styleUrl: './process-cih-pcr.css',
})
export class ProcessCihPcr implements OnInit, AfterViewInit {
    private dataTable: any;
  @ViewChild('fileInput') fileInput!: ElementRef;
  processMembersFormGroup!: FormGroup;
  selectedFile: File | null = null;
  isLoading = false;
  sessionId: string = "";
  tempMemberList: any;
  totalRecords: any;
  exist_count: number = 0;
  error_count: number = 0;
  isProcessing = false;
  isUpload = false;
  processLogList: any[] = [];
  constructor(private fb: FormBuilder, private apiService: ApiService,private auth: AuthService,private router: Router) {
    this.processMembersFormGroup = this.fb.group({
      file: [null, Validators.required]
    });
  }  
  ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }
  ngOnInit(): void {
    //throw new Error('Method not implemented.');
    const user = this.auth.getUser();
    //console.log(44);
    //console.log(user);
    if (!user) {
      //alert('User not logged in!');
      this.router.navigate(['/login']);
      return;
    }    
  }
  // onFileSelect(event: any): void {
  //   const file = event.target.files[0];
  //   if (file && file.type === 'text/csv') {
  //     this.selectedFile = file;
  //     this.processMembersFormGroup.patchValue({ file: file });
  //   } else {
  //     //alert('Please select a valid CSV file');
  //     this.selectedFile = null;
  //     //this.resetFileInput();
  //     this.processMembersFormGroup.get('file')?.reset();
  //     //this.processMembersFormGroup.reset();
  //   }
  // }

  onFileSelect(event: any): void {
  const file = event.target.files[0];

  if (file && file.type === 'text/csv') {
    this.selectedFile = file;
  } else {
    this.selectedFile = null;
    event.target.value = ''; // valid and allowed
  }
}


  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''; // ✅ allowed
    }
    this.processMembersFormGroup.get('file')?.reset();
    this.selectedFile = null;
  }


  async qualityFileSubmit(): Promise<void> {
  
    if (!this.processMembersFormGroup.valid || !this.selectedFile) {
      this.processMembersFormGroup.markAllAsTouched();
      return;
    }
  
    if (this.isUpload) return;
    this.isUpload = true;
    this.processLogList = [];
  
    const file = this.selectedFile;
    const ext = file.name.split('.').pop()?.toLowerCase();
  
    if (ext !== 'csv') {
      alert('Only .csv files are allowed.');
      this.isUpload = false;
      return;
    }
  
    try {
      this.sessionId = Math.floor(Date.now() / 1000).toString();
  
      // Parse CSV using PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
  
        complete: async (result) => {
          const rows: any[] = result.data;     // Parsed rows
          const parsedHeaders: string[] = result.meta.fields || [];
  
          const expectedHeaders = [
            'MEASURE_KEY','SUBMEASURE_KEY','MEMBER_NAME', 'AGE','BIRTH_DATE', 'PHONE_NUMBER', 'ADDRESSLINE1',
            'ADDRESSLINE2','CITY', 'STATECODE','ZIPCODE', 'PCP_ID','PCP_NPI','PCP_TIN', 'PCP_Name', 'PCP_GROUP',
            'CLSSDT', 'DENOM','DISCHARGE_CC_DESC_1', 'DISCHARGE_CC_DESC_2', 'DISCHARGE_CC_DESC_3', 'DISCH_ORDER',
            'INDEX_ADMIT_DT', 'INDEX_DISCH_DT','INDEX_STAY', 'MEMBERKEY','NUMER','READMISSION', 'READMT_ADMIT_DT','READMT_DISCH_DT'
          ];
  
          //console.log("Parsed Headers:", parsedHeaders);
  
          // Validate header 
          const headerMatch = JSON.stringify(parsedHeaders) === JSON.stringify(expectedHeaders);
          if (!headerMatch) {
            alert('File header mismatch.');
            this.resetFileInput();
            this.isUpload = false;
            return;
          }
  
          // Build array for inserting
          const dateFields = ['BIRTH_DATE', 'CLSSDT', 'INDEX_ADMIT_DT','INDEX_DISCH_DT','READMT_ADMIT_DT','READMT_DISCH_DT'];
          const insertDataArray: any[] = []; 
  
          rows.forEach((row: any) => {
            if (!row || Object.keys(row).length === 0) return;
  
            // if (row.Date_of_Birth) {
            //   row.Date_of_Birth = this.cleanDate(row.Date_of_Birth);
            // }
  
            row.INSERT_SESSION_ID = this.sessionId;
            insertDataArray.push(row);
          });
  
          //console.log("Insert Data:", insertDataArray);
  
          // Insert in batches of 1000
          const batches = this.chunkArray(insertDataArray, 1000);
  
          for (const batch of batches) {
            await firstValueFrom(
              this.apiService.post('prismMultipleinsert', {
                table_name: 'MEM_CIH_PCR_TEMP',
                insertDataArray: batch
              })
            );
          }
  
          // Fetch processed results
          const payload = { session_id: this.sessionId };
          this.apiService.post('prismGetcihpcr', payload).subscribe({
            next: (res: any) => {
              const list = res?.data || [];
              const total = res?.totalRecords || list.length;
              console.log(list);
              this.tempMemberList = list;
              this.totalRecords = total; 
              setTimeout(() => {
                  this.initializeDataTable('#cihTable', true);                  
              }, 200);
              
  
              this.isUpload = false;
            },
            error: () => {
              alert('Failed to load pcr data!');
              this.isUpload = false;
            }
          });
  
          // Reset form + file
          this.processMembersFormGroup.reset();
          this.selectedFile = null;
        },
  
        error: (err) => {
          console.error("CSV Parse Error:", err);
          alert("Unable to read CSV file.");
          this.isUpload = false;
        }
      });
  
    } catch (error) {
      console.error("Unexpected Error:", error);
      alert("Unexpected error while processing file.");
      this.isUpload = false;
    }
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
    autoWidth: false,   // IMPORTANT,
    columnDefs: [
    { width: "7%", targets: 4 } // <-- PCP VISIT column width
    ]
  };

  if (disableFirstColumnSort) {
    config.columnDefs = [{ orderable: false, targets: 0 }];
  }

  table.DataTable(config);
}

// initializeDataTable() {
//     setTimeout(() => {
//         if ($.fn.DataTable.isDataTable('#cihTable')) {
//             $('#cihTable').DataTable().clear().destroy();
//         }

//         this.dataTable = $('#cihTable').DataTable({
//             paging: true,
//             searching: true,
//             info: true,
//             scrollX: true,
//             autoWidth: false,
//             destroy: true,
//             retrieve: true
//         });
//     }, 100);
// }




 
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private cleanDate(value: any): string | null {
    if (!value || value.toString().trim() === '' || value.toString().toUpperCase() === 'NULL') {
      return null;
    }

    const val = value.toString().trim();

    // Already ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val;

    // Split on / or - and trim each part
    const parts = val.split(/[\/\-]/).map((p: string) => p.trim());
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;

      // Handle 2-digit year
      if (p3.length === 2) p3 = '20' + p3;

      // Determine if DD/MM/YYYY or MM/DD/YYYY
      if (parseInt(p1, 10) > 12) {
        // DD/MM/YYYY
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      } else {
        // MM/DD/YYYY
        return `${p3}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
      }
    }

    return null;
  }
 
  async processMembers(): Promise<void> {
    if (!this.sessionId) {
      alert('Missing session ID!');
      return;
    }

    this.isProcessing = true;

    const payload = {
      session_id: this.sessionId
    };

    try {
      const res = await firstValueFrom(
        this.apiService.post<any>('prismProcessMembersSeccionID', payload).pipe(finalize(() => {
          this.isProcessing = false;
          // ✅ Clear temp member data after successful process
            this.tempMemberList = [];
            this.totalRecords = 0;
            this.error_count = 0;
            this.exist_count = 0;
        }))
      );

      // ✅ Expected structure: res.data.loglist
      const logList = res?.data?.loglist || [];

      // Convert LOG_DATE string → Date
      this.processLogList = logList.map((log: any) => ({
        ...log,
        LOG_DATE: log.LOG_DATE
          ? new Date(log.LOG_DATE.replace('Z', '+00:00'))
          : null
      }));

      // Optional: reset session ID (like Django)
      this.sessionId = Math.floor(Date.now() / 1000).toString();

      console.log('✅ Member process completed:', this.processLogList);
      //alert('Member processing completed successfully!');

    } catch (err: any) {
      console.error('❌ Error processing members:', err);
      alert('Error processing pcr data. Please check logs or try again.');
      this.isProcessing = false;
    }
  }

  get fileControl() {
    return this.processMembersFormGroup.get('file');
  }
}
