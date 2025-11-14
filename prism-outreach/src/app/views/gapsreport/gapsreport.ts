import { Component, AfterViewInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var $: any;

@Component({
  selector: 'app-gapsreport',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, HttpClientModule],
  templateUrl: './gapsreport.html',
  styleUrls: ['./gapsreport.css']
})
export class GapsReportComponent implements AfterViewInit {

  startDate: string = ''; // YYYY-MM-DD
  endDate: string = '';   // YYYY-MM-DD

  gapsData: any[] = [];
  dataLoaded = false;

  constructor(private http: HttpClient) {

    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.startDate = this.formatDateForInput(firstDay);
    this.endDate = this.formatDateForInput(lastDay);

    this.searchData();
  }

  ngAfterViewInit(): void {
    // Activate jQuery UI DatePicker for START DATE
    $('#start_date').datepicker({
      dateFormat: 'mm/dd/yy',
      onSelect: (val: string) => this.updateStartDate(val)
    });

    // Activate jQuery UI DatePicker for END DATE
    $('#end_date').datepicker({
      dateFormat: 'mm/dd/yy',
      onSelect: (val: string) => this.updateEndDate(val)
    });
  }

  /** Convert JS Date → YYYY-MM-DD */
  private formatDateForInput(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Convert YYYY-MM-DD → MM/DD/YYYY for UI display */
  formatForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    const [yyyy, mm, dd] = isoDate.split('-');
    return `${mm}/${dd}/${yyyy}`;
  }

  /** Convert MM/DD/YYYY → YYYY-MM-DD when user selects */
  updateStartDate(val: string) {
    const [mm, dd, yyyy] = val.split('/');
    this.startDate = `${yyyy}-${mm}-${dd}`;
  }

  updateEndDate(val: string) {
    const [mm, dd, yyyy] = val.split('/');
    this.endDate = `${yyyy}-${mm}-${dd}`;
  }

  /** Fetch Report Data */
  searchData() {
    if (!this.startDate || !this.endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    this.dataLoaded = false;

    const apiUrl =
      'https://e9vakopr4c.execute-api.us-east-1.amazonaws.com/dev/prismGetgapsobservationdata-dev';

    const body = {
      start_date: this.startDate,
      end_date: this.endDate
    };

    this.http.post<any>(apiUrl, body).subscribe({
      next: (res) => {
        this.gapsData = res?.data || [];
        this.dataLoaded = true;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.gapsData = [];
        this.dataLoaded = true;
      }
    });
  }

  /** CSV DOWNLOAD */
  downloadCsv() {
    if (!this.gapsData.length) {
      alert('No data available to download.');
      return;
    }

    const header = Object.keys(this.gapsData[0]);

    const csvRows = [
      header.join('|'),
      ...this.gapsData.map((row) =>
        header.map((field) =>
          `${(row[field] ?? '').toString().replace(/\|/g, ' ')}`
        ).join('|')
      )
    ];

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();

    const filename = `RISK_GAPS_CIH_(${mm}-${dd}-${yyyy}).CSV`;

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}