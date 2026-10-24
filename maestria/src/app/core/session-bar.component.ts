import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-session-bar',
  template: `<nav *ngIf="auth.currentUser$ | async as user" class="session-bar" aria-label="Sesión">
    <span>{{ user.email }}</span><button type="button" (click)="logout()">Cerrar sesión</button>
  </nav>`,
  styles: [`.session-bar { display: flex; justify-content: flex-end; align-items: center; gap: 16px;
    flex-wrap: wrap; padding: 12px 24px; border-bottom: 1px solid #d5dce5; }
    span { overflow-wrap: anywhere; min-width: 0; }`],
})
export class SessionBarComponent {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth']);
  }
}
