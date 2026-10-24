import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { environment } from '../../environments/environment';

const user = { email: 'ana@example.com', rol: 'alumno' };
const token = (exp = Math.floor(Date.now() / 1000) + 7200) =>
  `${btoa('{}')}.${btoa(JSON.stringify({ id: '1', rol: 'alumno', exp }))}.signature`;
const ok = <T>(data: T) => ({ success: true, message: 'OK', data, errors: [] });

describe('AuthService e interceptor', () => {
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  beforeEach(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    TestBed.inject(AuthService).logout();
    http.verify();
  });

  function login() {
    const service = TestBed.inject(AuthService);
    const signed = token();
    service.login({ email: user.email, password: 'secreto123' }).subscribe();
    const request = http.expectOne(`${environment.authUrl}/login`);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(ok({ token: signed, user }));
    return { service, signed };
  }

  it('almacena y emite la sesión sólo después de un login exitoso', () => {
    const { service, signed } = login();
    let current: unknown;
    const subscription = service.currentUser$.subscribe(value => current = value);
    expect(current).toEqual(user);
    expect(service.getToken()).toBe(signed);
    expect(localStorage.getItem('access_token')).toBe(signed);
    service.logout();
    expect(current).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    subscription.unsubscribe();
  });

  it('registrarse no inicia sesión y los errores de credenciales no crean una sesión', () => {
    const service = TestBed.inject(AuthService);
    service.register({ email: user.email, password: 'secreto123' }).subscribe();
    http.expectOne(`${environment.authUrl}/register`).flush(ok(user));
    expect(service.getToken()).toBeNull();
    service.login({ email: user.email, password: 'incorrecta' }).subscribe({ error: () => {} });
    http.expectOne(`${environment.authUrl}/login`).flush({ success: false, message: 'Credenciales inválidas' },
      { status: 401, statusText: 'Unauthorized' });
    expect(service.getToken()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('adjunta JWT sólo a empleados y cierra sesión si el backend lo rechaza', () => {
    const { service, signed } = login();
    const client = TestBed.inject(HttpClient);
    client.get('https://external.example/api/v1/employees').subscribe();
    const external = http.expectOne('https://external.example/api/v1/employees');
    expect(external.request.headers.has('Authorization')).toBeFalse();
    external.flush([]);
    client.get(environment.apiUrl).subscribe({ error: () => {} });
    const employees = http.expectOne(environment.apiUrl);
    expect(employees.request.headers.get('Authorization')).toBe(`Bearer ${signed}`);
    employees.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(service.getToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('restaura sesiones vigentes y descarta tokens expirados', () => {
    const signed = token();
    localStorage.setItem('access_token', signed);
    localStorage.setItem('auth_user', JSON.stringify(user));
    const service = TestBed.inject(AuthService);
    expect(service.getToken()).toBe(signed);
    localStorage.setItem('access_token', token(1));
    window.dispatchEvent(new StorageEvent('storage'));
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('en SSR no accede al almacenamiento del navegador', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, { provide: Router, useValue: router }],
    });
    http = TestBed.inject(HttpTestingController);
    const read = spyOn(Storage.prototype, 'getItem').and.throwError('No browser storage');
    expect(TestBed.inject(AuthService).getToken()).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });
});
