import { Inject, Injectable, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/empleado';
import { AuthSession, AuthUser, Credentials } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = new BehaviorSubject<AuthUser | null>(null);
  readonly currentUser$ = this.user.asObservable();
  private token: string | null = null;
  private readonly browser: boolean;
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private readonly storageListener = () => {
    const previous = this.token;
    this.restore();
    if (previous && !this.token) void this.router.navigate(['/auth']);
  };

  constructor(private readonly http: HttpClient, private readonly router: Router,
    @Inject(PLATFORM_ID) platform: object, destroyRef: DestroyRef) {
    this.browser = isPlatformBrowser(platform);
    if (this.browser) {
      this.restore();
      window.addEventListener('storage', this.storageListener);
    }
    destroyRef.onDestroy(() => {
      clearTimeout(this.expiryTimer);
      if (this.browser) window.removeEventListener('storage', this.storageListener);
    });
  }

  login(credentials: Credentials): Observable<AuthSession> {
    return this.http.post<ApiResponse<AuthSession>>(`${environment.authUrl}/login`, credentials).pipe(
      map(response => this.unwrap(response)),
      tap(session => {
        const expires = this.expiresAt(session.token);
        if (!expires || expires <= Date.now()) throw new Error('El servidor devolvió una sesión inválida');
        this.setSession(session, expires);
        if (this.browser) {
          try {
            localStorage.setItem('access_token', session.token);
            localStorage.setItem('auth_user', JSON.stringify(session.user));
          } catch { /* The current tab can still use its in-memory session. */ }
        }
      }),
    );
  }

  register(credentials: Credentials): Observable<AuthUser> {
    return this.http.post<ApiResponse<AuthUser>>(`${environment.authUrl}/register`, credentials)
      .pipe(map(response => this.unwrap(response)));
  }

  getToken(): string | null {
    if (this.token && (this.expiresAt(this.token) ?? 0) <= Date.now()) this.logout();
    return this.token;
  }

  logout(): void {
    clearTimeout(this.expiryTimer);
    this.token = null;
    this.user.next(null);
    if (this.browser) {
      try { localStorage.removeItem('access_token'); localStorage.removeItem('auth_user'); } catch { /* Storage may be disabled. */ }
    }
  }

  endSession(): void {
    this.logout();
    void this.router.navigate(['/auth'], { queryParams: { expired: '1' } });
  }

  private restore(): void {
    try {
      const token = localStorage.getItem('access_token');
      const user = JSON.parse(localStorage.getItem('auth_user') ?? 'null') as AuthUser | null;
      const expires = token ? this.expiresAt(token) : null;
      if (!token || !expires || expires <= Date.now() || !user
        || typeof user.email !== 'string' || typeof user.rol !== 'string') {
        this.logout();
        return;
      }
      this.setSession({ token, user }, expires);
    } catch { this.logout(); }
  }

  private setSession(session: AuthSession, expires: number): void {
    clearTimeout(this.expiryTimer);
    this.token = session.token;
    this.user.next(session.user);
    if (this.browser) this.expiryTimer = setTimeout(() => this.endSession(), Math.min(expires - Date.now(), 2147483647));
  }

  private expiresAt(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const segment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')));
      return typeof claims.exp === 'number' && Number.isFinite(claims.exp)
        && typeof claims.id === 'string' && typeof claims.rol === 'string' ? claims.exp * 1000 : null;
    } catch { return null; }
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === null) throw new Error(response.message);
    return response.data;
  }
}
