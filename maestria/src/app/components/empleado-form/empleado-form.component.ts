import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Empleado, EmpleadoData } from '../../models/empleado';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoFormComponent implements OnChanges {
  @Input() empleado: Empleado | null = null;
  @Input() busy = false;
  @Input() revision = 0;
  @Output() readonly save = new EventEmitter<EmpleadoData>();
  @Output() readonly cancel = new EventEmitter<void>();
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    cargo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    departamento: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    sueldo: [0, [Validators.required, Validators.min(0)]],
  });
  constructor(private readonly fb: FormBuilder) {}
  ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
    if (changes['empleado'] || changes['revision']) {
      // Copy scalar values into a local form; never mutate an input object.
      const e = this.empleado;
      this.form.reset(e ? { nombre: e.nombre, cargo: e.cargo, departamento: e.departamento, sueldo: e.sueldo }
        : { nombre: '', cargo: '', departamento: '', sueldo: 0 });
    }
    if (this.busy) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }
  submit(): void {
    if (this.busy) return;
    const data = this.form.getRawValue();
    this.form.patchValue({ nombre: data.nombre.trim(), cargo: data.cargo.trim(), departamento: data.departamento.trim() });
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.save.emit({ ...this.form.getRawValue() });
  }
}
