import { Component } from '@angular/core';
import { LoaderService } from '../../services/loader'
@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrls: ['./loader.css']
})
export class LoaderComponent {
  loading$;  // Declare but don’t initialize yet

  constructor(private loaderService: LoaderService) {
    this.loading$ = this.loaderService.loading$; // ✅ safe now
  }
}
