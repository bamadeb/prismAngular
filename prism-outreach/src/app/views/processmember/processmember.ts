import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { ApiService } from '../../services/api.service'; // adjust path
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-processmember',
  standalone: true, // ✅ Add this
  imports: [CommonModule, ReactiveFormsModule], // ✅ Fix: import modules here
  templateUrl: './processmember.html',
  styleUrl: './processmember.css',
})
export class Processmember implements OnInit {
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
  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.processMembersFormGroup = this.fb.group({
      file: [null, Validators.required]
    });
  }  
  ngOnInit(): void {
    //throw new Error('Method not implemented.');
  }
  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.processMembersFormGroup.patchValue({ file: file });
    } else {
      //alert('Please select a valid CSV file');
      this.selectedFile = null;
      //this.resetFileInput();
      this.processMembersFormGroup.get('file')?.reset();
      //this.processMembersFormGroup.reset();
    }
  }
  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''; // ✅ allowed
    }
    this.processMembersFormGroup.get('file')?.reset();
    this.selectedFile = null;
  }

  async membersFileSubmit(): Promise<void> {
    //if (!this.processMembersFormGroup.valid || !this.selectedFile) return;
    //alert(this.processMembersFormGroup.valid);
    if (!this.processMembersFormGroup.valid || !this.selectedFile) {
      this.processMembersFormGroup.markAllAsTouched(); // ✅ Trigger validation messages
      //alert('Please select a file before uploading.');
      return;
    }
    if (this.isUpload) return;
    this.isUpload = true;
    const file = this.selectedFile;
    this.processLogList = [];
    // --- Check file extension ---
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      alert('Only .csv files are allowed.');
      this.resetFileInput();
      return;
    }

    try {
      // --- Read file content ---
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
      this.sessionId = Math.floor(Date.now() / 1000).toString(); 
      if (rows.length < 2) {
        alert('CSV file is empty or invalid.');
        this.resetFileInput();
        return;
      }

      // --- Parse headers ---
      const headers = rows[0].split(',').map(h => h.trim().replace(/\r/g, ''));

      const expectedHeaders = [
        'SUBSCRIBER_ID', 'MBR_PERIOD', 'FIRST_NM', 'MIDDLE_NM', 'LAST_NM',
        'MEDICARE_ID', 'MEDICAID_ID', 'DT_OF_BIRTH', 'SEX', 'ADDRESS_1',
        'ADDRESS_2', 'CITY', 'COUNTY', 'STATE', 'ZIP_CODE', 'HOME_TELEPHONE',
        'CELL_PHONE', 'EMAIL', 'RISK_SCORE', 'CONTRACT_NO', 'PBP', 'PCP_TAX_ID',
        'PCP_NPI', 'ENROLL_DT', 'PCP_EFF_DT_S', 'NETWORK_ID', 'NETWORK_NAME',
        'PCP_EFF_DT_E', 'PLAN_ID', 'PLAN_NAME', 'PLAN_DT_S', 'PLAN_DT_E',
        'DISENROLL_DT', 'DISENROLL_RSN_CD', 'DISENROLL_DESC',
        'AGT_REC_NM', 'AGT_REC_PH', 'AGT_REC_EM'
      ];

      // --- Validate headers ---
      const headerMatch = JSON.stringify(headers) === JSON.stringify(expectedHeaders);
      if (!headerMatch) {
        alert('File header mismatch.');
        this.resetFileInput();
        return;
      }

      // --- Parse data rows ---
      const insertDataArray: any[] = [];
      const dateFields = ['DT_OF_BIRTH', 'ENROLL_DT', 'PCP_EFF_DT_S'];
      const otherDates = ['PCP_EFF_DT_E', 'PLAN_DT_S', 'PLAN_DT_E', 'DISENROLL_DT'];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        if (cols.length !== headers.length) continue; // skip invalid rows

        const row: any = {};
        headers.forEach((h, idx) => row[h] = cols[idx] || null);

        // Format date fields
        for (const f of dateFields) {
          if (row[f]) row[f] = this.cleanDate(row[f]);
        }

        // Remove unwanted date columns
        for (const f of otherDates) {
          delete row[f];
        }

        row['INSERT_SESSION_ID'] = this.sessionId; // assign your session id variable
        insertDataArray.push(row);
      }

      // --- Split into batches of 1000 ---
      const batches = this.chunkArray(insertDataArray, 1000);

      // --- Send each batch to backend ---
      for (let batchNum = 0; batchNum < batches.length; batchNum++) {
        const apidata = {
          table_name: 'MEM_MEMBERS_TEMP',
          insertDataArray: batches[batchNum],
        };

        console.log(`Processing batch ${batchNum + 1}/${batches.length}`);
        console.log(insertDataArray);
          await firstValueFrom(
            this.apiService.post('prismMultipleinsert', apidata).pipe(
              finalize(() => console.log(`✅ Batch ${batchNum + 1} completed.`))
            )
          );
        //await this.apiService.post('prismMultipleRowInsert', apidata).toPromise();

        //await this.apiService.post('prismMultipleinsert', apidata).toPromise();
                // this.apiService.post('prismMultipleinsert', apidata).subscribe({
                //     next: (res: any) => {
                //       console.log('✅ Data inserted:', res);
                      
                //      // alert('Action saved successfully!');
                //     },
                //     error: (err) => {
                //       console.error('❌ Error inserting action:', err);
                //       alert('Failed to save action!');
                //     },
                // });
      }

      //alert('File processed and uploaded successfully!');
    // ✅ After all inserts, fetch temp members by session_id
          const getApiData = { session_id: this.sessionId };

          this.apiService.post('prismGetTempMembersBySeccionID', getApiData).subscribe({
            next: (res: any) => {
              console.log('✅ Temp members fetched:', res);

              const tempMemberList = res?.data || [];
              const totalRecords = res?.totalRecords || tempMemberList.length;

              let exist_count = 0;
              let error_count = 0;

              tempMemberList.forEach((member: any) => {
                if (member.exist_member) exist_count++;
                if (!member.SUBSCRIBER_ID || member.SUBSCRIBER_ID.trim() === '') {
                  error_count++;
                }

                // Optional: format date fields
                if (member.DT_OF_BIRTH) {
                  member.DT_OF_BIRTH = new Date(member.DT_OF_BIRTH);
                }
              });

              console.log('temp Member List:', tempMemberList);
              console.log('Total Records:', totalRecords);
              console.log('Exist Count:', exist_count);
              console.log('Error Count:', error_count);

              // store or display results
              this.tempMemberList = tempMemberList;
              this.totalRecords = totalRecords;
              this.exist_count = exist_count;
              this.error_count = error_count;
              this.isUpload = false;
            },
            error: (err) => {
              console.error('❌ Error fetching temp members:', err);
              //alert('Failed to load temporary member list!');
              this.isUpload = false;
            },
          });      
      //this.processMembersFormGroup.reset();
      this.selectedFile = null;
      this.resetFileInput();
    } catch (error) {
      console.error('Error reading or uploading CSV:', error);
      alert('Error processing file. Please check your CSV format.');
      this.isUpload = false;
    }finally {
      console.log("finally");
       // ✅ Always re-enable the button
    }
  }
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
      alert('Error processing members. Please check logs or try again.');
      this.isProcessing = false;
    }
  }

  get fileControl() {
    return this.processMembersFormGroup.get('file');
  }
}
