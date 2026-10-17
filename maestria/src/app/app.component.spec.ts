import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

describe('AppComponent', () => {
  it('renderiza la gestión de empleados', async () => {
    await TestBed.configureTestingModule({ imports: [AppModule, HttpClientTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(environment.apiUrl).flush({ success: true, message: 'OK', data: [], errors: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Gestión de empleados');
    fixture.destroy();
    http.verify();
  });
});
