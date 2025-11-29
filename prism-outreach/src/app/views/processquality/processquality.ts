import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import * as Papa from 'papaparse';
@Component({
  selector: 'app-processquality',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './processquality.html',
  styleUrl: './processquality.css',
})
export class Processquality implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  processQualityFormGroup!: FormGroup;
  selectedFile: File | null = null;
  isUpload = false;
  isProcessing = false;
  sessionId = '';
  tempQualityList: any[] = [];
  totalRecords = 0;
  exist_count = 0;
  error_count = 0;
  processLogList: any[] = [];
  ngOnInit(): void {
    
    const user = this.auth.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }    
  }
  constructor(private fb: FormBuilder, private apiService: ApiService,private auth: AuthService,private router: Router) {
    this.processQualityFormGroup = this.fb.group({
      file: [null, Validators.required]
    });
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.processQualityFormGroup.patchValue({ file });
    } else {
      this.selectedFile = null;
      this.processQualityFormGroup.get('file')?.reset();
      //this.processQualityFormGroup.reset();
    }
  }

  // async qualityFileSubmit(): Promise<void> {
  //   if (!this.processQualityFormGroup.valid || !this.selectedFile) {
  //     this.processQualityFormGroup.markAllAsTouched();
  //     return;
  //   }

  //   if (this.isUpload) return;
  //   this.isUpload = true;
  //   this.processLogList = [];
  //   const file = this.selectedFile;
  //   const ext = file.name.split('.').pop()?.toLowerCase();
  //   if (ext !== 'csv') {
  //     alert('Only .csv files are allowed.');
  //     this.isUpload = false;
  //     return;
  //   }

  //   try {
  //     const text = await file.text();
  //     const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
  //     this.sessionId = Math.floor(Date.now() / 1000).toString();

  //     const headers = rows[0].split(',').map(h => h.trim());
  //     const expectedHeaders = [
  //       'Subscriber ID', 'Measure Name', 'Submeasure', 'First Name', 'Middle Name',
  //       'Last Name', 'Medicare ID', 'Medicaid ID', 'Date of Birth', 'Sex',
  //       'Provider ID', 'Provider Name', 'Numerator_Gap'
  //     ];
  //     // const expectedHeaders = [
  //     //   'Subscriber_ID', 'Measure_Name', 'Submeasure', 'First_Name', 'Middle_Name',
  //     //   'Last_Name', 'Medicare_ID', 'Medicaid_ID', 'Date_of_Birth', 'Sex',
  //     //   'Provider_ID', 'Provider_TIN', 'Provider_Name', 'Numerator_Gap'
  //     // ];      
  //     console.log("expectedHeaders :", expectedHeaders);
  //     console.log("headers :", headers);
  //     console.log("rows :", rows);
  //     if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  //       alert('File header mismatch.');
  //       this.isUpload = false;
  //       return;
  //     }

  //     const insertDataArray: any[] = [];
  //     for (let i = 1; i < rows.length; i++) {
  //       const cols = rows[i].split(',').map(c => c.trim());
  //             console.log("cols.length :", cols.length , "headers.length", headers.length);
  //             console.log("cols: ", cols)
  //       if (cols.length !== headers.length) continue;

  //       const row: any = {};
  //       headers.forEach((h, idx) => {
  //         const key = h.replace(/\s+/g, '_');
  //         row[key] = cols[idx] || null;
  //       });

  //       if (row['Date_of_Birth']) row['Date_of_Birth'] = this.cleanDate(row['Date_of_Birth']);
  //       row['INSERT_SESSION_ID'] = this.sessionId;
  //       insertDataArray.push(row);
  //     }
  //     console.log(insertDataArray);
  //     const batches = this.chunkArray(insertDataArray, 1000);
  //     for (const batch of batches) {
  //       const apidata = { table_name: 'MEM_CIH_QUALITY_TEMP', insertDataArray: batch };
  //       await firstValueFrom(this.apiService.post('prismMultipleinsert', apidata));
  //     }

  //     const getApiData = { session_id: this.sessionId };
  //     this.apiService.post('prismGetTempQualityGapsBySeccionID', getApiData).subscribe({
  //       next: (res: any) => {
  //         const list = res?.data || [];
  //         const total = res?.totalRecords || list.length;

  //         let exist = 0, errors = 0;
  //         list.forEach((q: any) => {
  //           if (!q.member_exist) errors++;
  //           if (q.quality_gaps_exist) exist++;
  //           if (q.Date_of_Birth) q.Date_of_Birth = new Date(q.Date_of_Birth);
  //         });

  //         this.tempQualityList = list;
  //         this.totalRecords = total;
  //         this.exist_count = exist;
  //         this.error_count = errors;
  //         this.isUpload = false;
  //       },
  //       error: (err) => {
  //         console.error('Error fetching quality gaps:', err);
  //         alert('Failed to load quality gaps!');
  //         this.isUpload = false;
  //       }
  //     });

  //     this.processQualityFormGroup.reset();
  //     this.selectedFile = null;
  //   } catch (error) {
  //     console.error('Error processing file:', error);
  //     alert('Error reading file. Check your CSV format.');
  //     this.isUpload = false;
  //   } finally {
  //    // this.isUpload = false;
  //   }
  // }
async qualityFileSubmit(): Promise<void> {

  if (!this.processQualityFormGroup.valid || !this.selectedFile) {
    this.processQualityFormGroup.markAllAsTouched();
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
          'Subscriber_ID', 'Measure_Name', 'Submeasure', 'First_Name', 'Middle_Name',
          'Last_Name', 'Medicare_ID', 'Medicaid_ID', 'Date_of_Birth', 'Sex',
          'Provider_ID', 'Provider_TIN', 'Provider_Name', 'Numerator_Gap'
        ];

        console.log("Parsed Headers:", parsedHeaders);

        // Validate header
        if (JSON.stringify(parsedHeaders) !== JSON.stringify(expectedHeaders)) {
          alert("File header mismatch.");
          this.isUpload = false;
          return;
        }

        // Build array for inserting
        const insertDataArray: any[] = [];

        rows.forEach((row: any) => {
          if (!row || Object.keys(row).length === 0) return;

          if (row.Date_of_Birth) {
            row.Date_of_Birth = this.cleanDate(row.Date_of_Birth);
          }

          row.INSERT_SESSION_ID = this.sessionId;
          insertDataArray.push(row);
        });

        console.log("Insert Data:", insertDataArray);

        // Insert in batches of 1000
        const batches = this.chunkArray(insertDataArray, 1000);

        for (const batch of batches) {
          await firstValueFrom(
            this.apiService.post('prismMultipleinsert', {
              table_name: 'MEM_CIH_QUALITY_TEMP',
              insertDataArray: batch
            })
          );
        }

        // Fetch processed results
        const payload = { session_id: this.sessionId };
        this.apiService.post('prismGetTempQualityGapsBySeccionID', payload).subscribe({
          next: (res: any) => {
            const list = res?.data || [];
            const total = res?.totalRecords || list.length;

            let exist = 0, errors = 0;

            list.forEach((q: any) => {
              if (!q.member_exist) errors++;
              if (q.quality_gaps_exist) exist++;
              if (q.Date_of_Birth) q.Date_of_Birth = new Date(q.Date_of_Birth);
            });

            this.tempQualityList = list;
            this.totalRecords = total;
            this.exist_count = exist;
            this.error_count = errors;

            this.isUpload = false;
          },
          error: () => {
            alert('Failed to load quality gaps!');
            this.isUpload = false;
          }
        });

        // Reset form + file
        this.processQualityFormGroup.reset();
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
    alert("Unexpected error while processing quality gaps file.");
    this.isUpload = false;
  }
}
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }

  private cleanDate(value: string): string | null {
    if (!value || value.trim() === '') return null;
    const val = value.trim();
    const parts = val.split(/[\/\-]/);
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;
      if (p3.length === 2) p3 = '20' + p3;
      if (parseInt(p1, 10) > 12)
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      else
        return `${p3}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    }
    return null;
  }

  async processQualityGaps(): Promise<void> {
    if (!this.sessionId) {
      alert('Missing session ID!');
      return;
    }

    this.isProcessing = true;
    const payload = { session_id: this.sessionId };

    try {
      const res = await firstValueFrom(
        this.apiService.post<any>('prismProcessQualityGapsSeccionID', payload).pipe(finalize(() => {
          this.isProcessing = false;
          this.tempQualityList = [];
          this.totalRecords = 0;
          this.exist_count = 0;
          this.error_count = 0;
        }))
      );

      const logList = res?.data?.loglist || [];
      this.processLogList = logList.map((log: any) => ({
        ...log,
        LOG_DATE: log.LOG_DATE ? new Date(log.LOG_DATE.replace('Z', '+00:00')) : null
      }));

      this.sessionId = Math.floor(Date.now() / 1000).toString();
      console.log('Quality gaps process completed:', this.processLogList);
    } catch (err) {
      console.error('Error processing quality gaps:', err);
      alert('Error processing quality gaps.');
      this.isProcessing = false;
    }
  }
}