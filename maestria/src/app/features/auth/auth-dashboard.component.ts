import { Component, DestroyRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { Credentials } from '../../core/auth.models';

@Component({
  selector: 'app-auth-dashboard',
  templateUrl: './auth-dashboard.component.html',
  styleUrl: './auth-dashboard.component.css',
})
export class AuthDashboardComponent {
  readonly registering = this.route.snapshot.data['registering'] === true;
  readonly registered = this.route.snapshot.queryParamMap.has('registered');
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  busy = false;
  error: string | null = null;

  constructor(private readonly auth: AuthService, private readonly route: ActivatedRoute,
    private readonly router: Router, private readonly destroyRef: DestroyRef) {}

  submit(credentials: Credentials): void {
    if (this.busy) return;
    this.busy = true;
    this.error = null;
    const request: Observable<unknown> = this.registering ? this.auth.register(credentials) : this.auth.login(credentials);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy = false)).subscribe({
      next: () => {
        if (this.registering) void this.router.navigate(['/auth'], { queryParams: { registered: '1' } });
        else void this.router.navigate(['/employees']);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          const body = error.error;
          const details = Array.isArray(body?.errors)
            ? body.errors.map((entry: { message: string }) => entry.message).join('. ') : '';
          this.error = error.status === 0 ? 'No se pudo conectar con el servidor. Intente nuevamente.'
            : [typeof body?.message === 'string' ? body.message : 'No se pudo completar la solicitud', details].filter(Boolean).join('. ');
        } else this.error = error instanceof Error ? error.message : 'No se pudo completar la solicitud';
      },
    });
  }
}
