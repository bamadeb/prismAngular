import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../templates/header/header.component';
import { FooterComponent } from '../../templates/footer/footer.component';
import { MenuComponent } from '../../templates/menu/menu.component';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, MenuComponent],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayout { 
   pageTitle = '';

  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title) {}

   ngOnInit(): void {
    // ✅ Handle title immediately when component loads
    this.setPageTitle(this.route);

    // ✅ Also react on route change events (e.g., navigation within main layout)
    this.router.events.subscribe(() => {
      this.setPageTitle(this.route);
    });
  }

  private setPageTitle(route: ActivatedRoute): void {
    let active = route;
    while (active.firstChild) {
      active = active.firstChild;
    }

    const title = active.snapshot.data?.['title'] || 'PRISM OUTREACH';
    this.pageTitle = title;
    this.titleService.setTitle(title);
    console.log('✅ Page title detected:', this.pageTitle);
  }
}
