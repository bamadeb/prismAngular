import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const USER_KEY = 'app_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router) {}  // ✅ keep only this, no `router: any`

  // ✅ Get full name with role
  getUserName(): string {
    const user = this.getUser();
    return [user?.FistName, user?.LastName].filter(Boolean).join(' ')
      + (user?.ROLE_NAME ? ` (${user.ROLE_NAME})` : '');
  }

   // ✅ Get full name with role
  getName(): string {
    const user = this.getUser();
    return [user?.FistName, user?.LastName].filter(Boolean).join(' ');
  }

  // ✅ Save user data
  setUser(user: any): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Error saving user to localStorage', err);
    }
  }

  // ✅ Get stored user data
  getUser<T = any>(): T | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? (JSON.parse(data) as T) : null;
  }

  // ✅ Remove user data (logout)
  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // ✅ Check if logged in
  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  // ✅ Logout and redirect
  logout(): void {
    this.clearUser();
    sessionStorage.clear();
    this.router.navigate(['/']); // works now
  }
}
