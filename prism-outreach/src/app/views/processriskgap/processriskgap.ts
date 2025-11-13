import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-processriskgap',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './processriskgap.html',
  styleUrl: './processriskgap.css'
})
export class Processriskgap implements OnInit {
  processRiskGapsFormGroup!: FormGroup;
  selectedFile: File | null = null;
  isUpload = false;
  isProcessing = false;
  sessionId = '';
  tempRiskGapsList: any[] = [];
  totalRecords = 0;
  exist_count = 0;
  error_count = 0;
  processLogList: any[] = [];

  constructor(private fb: FormBuilder, private apiService: ApiService,private auth: AuthService,private router: Router) {
    this.processRiskGapsFormGroup = this.fb.group({
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }  
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.processRiskGapsFormGroup.patchValue({ file });
    } else {
      this.selectedFile = null;
      this.processRiskGapsFormGroup.reset();
    }
  }

  async riskGapsFileSubmit(): Promise<void> {
    if (!this.processRiskGapsFormGroup.valid || !this.selectedFile) {
      this.processRiskGapsFormGroup.markAllAsTouched();
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
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
      this.sessionId = Math.floor(Date.now() / 1000).toString();

      if (rows.length < 2) {
        alert('CSV file is empty or invalid.');
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim());
      const expectedHeaders = [
        'PAT_ID', 'MBR_ID', 'PRODUCT_TYPE', 'HCC_CATEGORY', 'HCC_MODEL', 'STATUS',
        'RELEVANT_DATE', 'DIAG_SOURCE', 'DIAG_CODE', 'DIAG_DESC', 'PROV_SPECIALTY'
      ];

      if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
        alert('File header mismatch.');
        this.isUpload = false;
        return;
      }

      const insertDataArray: any[] = [];
      const dateFields = ['RELEVANT_DATE'];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        if (cols.length !== headers.length) continue;

        const row: any = {};
        headers.forEach((h, idx) => row[h] = cols[idx] || null);
        for (const f of dateFields) {
          if (row[f]) row[f] = this.cleanDate(row[f]);
        }
        row['INSERT_SESSION_ID'] = this.sessionId;
        insertDataArray.push(row);
      }

      const batches = this.chunkArray(insertDataArray, 1000);
      for (let batchNum = 0; batchNum < batches.length; batchNum++) {
        const apidata = { table_name: 'MEM_RISK_GAP_TEMP', insertDataArray: batches[batchNum] };
        await firstValueFrom(this.apiService.post('prismMultipleinsert', apidata));
      }

      const getApiData = { session_id: this.sessionId };
      this.apiService.post('prismGetTempRiskGapsBySeccionID', getApiData).subscribe({
        next: (res: any) => {
          const tempList = res?.data || [];
          const totalRecords = res?.totalRecords || tempList.length;

          let exist = 0, errors = 0;
          tempList.forEach((gap: any) => {
            if (!gap.member_exist) errors++;
            if (gap.exist_gap) exist++;
            if (gap.RELEVANT_DATE) gap.RELEVANT_DATE = new Date(gap.RELEVANT_DATE);
          });

          this.tempRiskGapsList = tempList;
          this.totalRecords = totalRecords;
          this.exist_count = exist;
          this.error_count = errors;
          this.isUpload = false;
        },
        error: (err) => {
          console.error('Error fetching temp risk gaps:', err);
          alert('Failed to load temporary risk gaps!');
          this.isUpload = false;
        }
      });

      this.processRiskGapsFormGroup.reset();
      this.selectedFile = null;

    } catch (error) {
      console.error('Error reading or uploading CSV:', error);
      alert('Error processing file. Please check your CSV format.');
      this.isUpload = false;
    } finally {
      //this.isUpload = false;
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }

  private cleanDate(value: any): string | null {
    if (!value || value.toString().trim() === '') return null;
    const val = value.toString().trim();
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

  async processRiskGaps(): Promise<void> {
    if (!this.sessionId) {
      alert('Missing session ID!');
      return;
    }

    this.isProcessing = true;
    const payload = { session_id: this.sessionId };

    try {
      const res = await firstValueFrom(
        this.apiService.post<any>('prismProcessRiskGapsSeccionID', payload).pipe(finalize(() => {
          this.isProcessing = false;
          this.tempRiskGapsList = [];
          this.totalRecords = 0;
          this.error_count = 0;
          this.exist_count = 0;
        }))
      );

      const logList = res?.data?.loglist || [];
      this.processLogList = logList.map((log: any) => ({
        ...log,
        LOG_DATE: log.LOG_DATE ? new Date(log.LOG_DATE.replace('Z', '+00:00')) : null
      }));

      this.sessionId = Math.floor(Date.now() / 1000).toString();
      console.log('Risk gaps process completed:', this.processLogList);

    } catch (err) {
      console.error('Error processing risk gaps:', err);
      alert('Error processing risk gaps. Please try again.');
      this.isProcessing = false;
    }
  }
}
