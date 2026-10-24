import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly auth: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = new URL(request.url, 'http://angular.local');
    const api = new URL(environment.apiUrl, 'http://angular.local');
    const protectedRequest = url.origin === api.origin
      && /^\/api\/v1\/(employees|empleados)(\/|$)/.test(url.pathname);
    const token = protectedRequest ? this.auth.getToken() : null;
    const outgoing = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
    return next.handle(outgoing).pipe(catchError((error: unknown) => {
      if (protectedRequest && error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)
        && this.auth.getToken() === token) this.auth.endSession();
      return throwError(() => error);
    }));
  }
}
