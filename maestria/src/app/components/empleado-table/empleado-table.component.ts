import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Empleado } from '../../models/empleado';

@Component({
  selector: 'app-empleado-table',
  templateUrl: './empleado-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoTableComponent {
  @Input() empleados: readonly Empleado[] = [];
  @Input() busy = false;
  @Output() readonly edit = new EventEmitter<Empleado>();
  @Output() readonly remove = new EventEmitter<string>();
  pendingId: string | null = null;
  trackById(_index: number, employee: Empleado): string { return employee._id; }
  confirmDelete(id: string): void { this.pendingId = null; this.remove.emit(id); }
}
