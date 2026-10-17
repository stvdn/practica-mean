import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppModule } from '../../app.module';
import { EmpleadoComponent } from './empleado.component';
import { environment } from '../../../environments/environment';

describe('EmpleadoComponent', () => {
  it('consume el servicio con async y renderiza formulario y tabla independientes', async () => {
    await TestBed.configureTestingModule({ imports: [AppModule, HttpClientTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(EmpleadoComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(environment.apiUrl).flush({ success: true, message: 'OK', data: [], errors: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-empleado-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-empleado-table').textContent).toContain('No hay empleados');
    fixture.destroy();
    http.verify();
  });
});
