import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '../../models/api-response';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  [x: string]: any;
username = '';
  password = '';
  apiUrl = 'https://e9vakopr4c.execute-api.us-east-1.amazonaws.com/dev/prismAuthentication-dev'; // your backend API
  apires: ApiResponse = {
  statusCode: 0,
  data: [],
  };
  constructor(private apiService: ApiService, private http: HttpClient, private router: Router, private auth: AuthService) {}

  loginUser() {
    const payload = {
      username: this.username,
      password: this.password,
    };


    this.apiService.post<ApiResponse>('prismAuthentication', payload)
      .subscribe({
        next: (res) => {
          if (res.data && res.data.length > 0) {
            const user = res.data[0];
            this.auth.setUser(user);
            console.log('✅ Login success:', res);
            const loginuser = this.auth.getUser();
            const user_role = loginuser.role_id;
            if(user_role == 7){
              this.router.navigate(['/users']);
            }else{
              this.router.navigate(['/dashboard']);
            }

          } else {
            alert('Invalid login credentials');
          }
        },
        error: (err) => {
          console.error('❌ Login failed:', err);
          alert('Server error. Please try again later.');
        }
      });

  }
}
