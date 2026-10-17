import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './empleado.service';
import { Empleado } from '../models/empleado';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

const employee: Empleado = { _id: '000000000000000000000001', nombre: 'Ana Pérez', cargo: 'Developer', departamento: 'TI', sueldo: 100 };
const ok = <T>(data: T) => ({ success: true, message: 'OK', data, errors: [] });

describe('EmployeeService', () => {
  let service: EmployeeService;
  let http: HttpTestingController;
  let subscription: Subscription;
  let employees: readonly Empleado[];
  let error: string | null;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(EmployeeService);
    http = TestBed.inject(HttpTestingController);
    subscription = service.vm$.subscribe(state => { employees = state.empleados; error = state.error; });
    http.expectOne(environment.apiUrl).flush(ok([employee]));
  });
  afterEach(() => { subscription.unsubscribe(); http.verify(); });

  it('crea, actualiza y elimina sin mutar referencias anteriores', () => {
    const beforeCreate = employees;
    service.save({ nombre: 'Luis Pérez', cargo: 'QA', departamento: 'TI', sueldo: 200 });
    const second = { ...employee, _id: '000000000000000000000002', nombre: 'Luis Pérez' };
    const create = http.expectOne(environment.apiUrl);
    expect(create.request.method).toBe('POST');
    create.flush(ok(second));
    expect(beforeCreate.length).toBe(1);
    expect(employees.length).toBe(2);
    expect(employees).not.toBe(beforeCreate);
    service.select(employee);
    const beforeUpdate = employees;
    service.save({ nombre: employee.nombre, cargo: 'Director', departamento: 'TI', sueldo: 300 });
    const update = http.expectOne(`${environment.apiUrl}/${employee._id}`);
    expect(update.request.method).toBe('PUT');
    update.flush(ok({ ...employee, cargo: 'Director', sueldo: 300 }));
    expect(beforeUpdate[0].cargo).toBe('Developer');
    expect(employees[0].cargo).toBe('Director');
    const beforeDelete = employees;
    service.delete(employee._id);
    const remove = http.expectOne(`${environment.apiUrl}/${employee._id}`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(ok(employee));
    expect(beforeDelete.length).toBe(2);
    expect(employees.length).toBe(1);
  });

  it('mantiene el estado tras un error y permite reintentar', () => {
    const before = employees;
    service.delete(employee._id);
    http.expectOne(`${environment.apiUrl}/${employee._id}`).flush(
      { success: false, message: 'Error interno del servidor', data: null, errors: [] },
      { status: 500, statusText: 'Internal Server Error' });
    expect(error).toBe('Error interno del servidor');
    expect(employees).toBe(before);
    service.load();
    http.expectOne(environment.apiUrl).flush(ok([]));
    expect(error).toBeNull();
    expect(employees.length).toBe(0);
  });

  it('comparte una sola petición inicial entre consumidores', () => {
    const secondSubscription = service.vm$.subscribe();
    http.expectNone(environment.apiUrl);
    expect(employees.length).toBe(1);
    secondSubscription.unsubscribe();
  });
});
