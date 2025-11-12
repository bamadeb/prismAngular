import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,                // ✅ Recommended for standalone components
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userName: string = '';
  Name: string = '';
  pageTitle: string = '';

  constructor(
    private auth: AuthService,
    private router: Router,          // ✅ Inject Router
    private route: ActivatedRoute,    // ✅ Inject ActivatedRoute
    private titleService: Title 
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getUserName();
    this.Name = this.auth.getName ? this.auth.getName() : '';

    // ✅ Listen to route changes and update title dynamically
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        return child?.snapshot.data?.['title'] || '';
      })
    ).subscribe((title: string) => {     
      this.pageTitle = title;
      this.titleService.setTitle(title);

    });
  }

  logout() {
    this.auth.logout();
  }
}
