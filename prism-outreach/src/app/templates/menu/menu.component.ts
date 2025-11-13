import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  userRole: number | null = null;
    constructor(
      private auth: AuthService,private router: Router,
  ) {}
  ngOnInit(): void {
    const user = this.auth.getUser();
    if(user){
      this.userRole = user.role_id;
    }else{
        this.router.navigate(['/login']);
        return;

    }
    

  }
 }
