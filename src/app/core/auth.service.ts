import { computed, Injectable, signal } from '@angular/core';

type LoginUser = {
  username: string;
  displayName: string;
};

const STORAGE_KEY = 'vehicle-service-booking-user';

const DEMO_USER = {
  username: 'advisor',
  password: 'service123',
  displayName: 'Workshop Advisor'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserState = signal<LoginUser | null>(this.readStoredUser());

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserState() !== null);

  login(username: string, password: string): boolean {
    const normalized = username.trim().toLowerCase();

    if (normalized === DEMO_USER.username && password === DEMO_USER.password) {
      const user = {
        username: DEMO_USER.username,
        displayName: DEMO_USER.displayName
      };

      this.currentUserState.set(user);
      this.writeStoredUser(user);
      return true;
    }

    return false;
  }

  logout(): void {
    this.currentUserState.set(null);
    this.clearStoredUser();
  }

  private readStoredUser(): LoginUser | null {
    if (!this.hasStorage()) {
      return null;
    }

    const value = localStorage.getItem(STORAGE_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as LoginUser;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private writeStoredUser(user: LoginUser): void {
    if (!this.hasStorage()) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private clearStoredUser(): void {
    if (!this.hasStorage()) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
