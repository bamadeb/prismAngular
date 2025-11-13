import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

const USER_KEY = 'app_user';
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds
@Injectable({ providedIn: 'root' })
export class AuthService {
  private inactivityTimer: any;
  constructor(private router: Router, private ngZone: NgZone) {this.startInactivityWatcher();}  // ✅ keep only this, no `router: any`

  // ✅ Start tracking user activity
  private startInactivityWatcher(): void {
    ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(event =>
      window.addEventListener(event, () => this.resetInactivityTimer())
    );
    this.resetInactivityTimer();
  }
  // ✅ Reset inactivity timer
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = setTimeout(() => {
        this.ngZone.run(() => this.logoutDueToInactivity());
      }, INACTIVITY_LIMIT);
    });
  }

  // ✅ Handle logout due to inactivity
  private logoutDueToInactivity(): void {
    this.clearUser();
    sessionStorage.clear();
    //alert('You have been logged out due to 10 minutes of inactivity.');
    this.router.navigate(['/']);
  }

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
