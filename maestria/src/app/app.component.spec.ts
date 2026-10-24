import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('redirige el acceso directo a empleados al login sin solicitar datos', async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    await TestBed.configureTestingModule({ imports: [AppModule, HttpClientTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/employees');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    expect(router.url).toBe('/auth');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Iniciar sesión');
    fixture.destroy();
    http.verify();
  });
});
