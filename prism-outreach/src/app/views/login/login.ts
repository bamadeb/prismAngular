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

  username = '';
  password = '';
  errorMsg: string = '';
  isLoading: boolean = false;

  apires: ApiResponse = {
    statusCode: 0,
    data: [],
  };

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  async loginUser() {
    this.clearError();
    this.isLoading = true;

    const payload = {
      username: this.username,
      password: this.password,
    };

    try {
      await this.auth.login(this.username, this.password);

      this.apiService.post<ApiResponse>('prismAuthentication', payload)
        .subscribe({
          next: (res) => {
            this.isLoading = false;

            if (res.data && res.data.length > 0) {
              const user = res.data[0];
              this.auth.setUser(user);

              const roleId = user.role_id;

              if (roleId == 7) {
                this.router.navigate(['/users']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            } else {
              this.errorMsg = 'Invalid login credentials';
            }
          },
          error: () => {
            this.isLoading = false;
            this.errorMsg = 'Invalid login credentials';
          }
        });

    } catch (err) {
      this.isLoading = false;
      this.errorMsg = 'Invalid login credentials';
    }
  }

  clearError() {
    this.errorMsg = '';
  }
}
