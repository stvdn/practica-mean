import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EmpleadoFormComponent } from './empleado-form.component';

describe('EmpleadoFormComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [CommonModule, ReactiveFormsModule], declarations: [EmpleadoFormComponent],
  }));
  it('clona la entrada y emite los datos sin modificar al empleado original', () => {
    const fixture = TestBed.createComponent(EmpleadoFormComponent);
    const employee = Object.freeze({ _id: 'id', nombre: 'Ana Pérez', cargo: 'QA', departamento: 'TI', sueldo: 100 });
    fixture.componentRef.setInput('empleado', employee);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.nombre.setValue('Ana Editada');
    const emit = spyOn(fixture.componentInstance.save, 'emit');
    fixture.componentInstance.submit();
    expect(employee.nombre).toBe('Ana Pérez');
    expect(emit).toHaveBeenCalledWith({ nombre: 'Ana Editada', cargo: 'QA', departamento: 'TI', sueldo: 100 });
  });
  it('rechaza formularios inválidos y reinicia tras guardar', () => {
    const fixture = TestBed.createComponent(EmpleadoFormComponent);
    fixture.detectChanges();
    const emit = spyOn(fixture.componentInstance.save, 'emit');
    fixture.componentInstance.submit();
    expect(emit).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.nombre.setValue('Borrador');
    fixture.componentRef.setInput('revision', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.nombre.value).toBe('');
  });
});
