import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  userRole: number | null = null;
    constructor(
      private auth: AuthService
  ) {}
  ngOnInit(): void {
    const user = this.auth.getUser();
    if(user)
    this.userRole = user.role_id;

  }
 }
