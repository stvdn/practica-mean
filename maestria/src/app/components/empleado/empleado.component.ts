import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmployeeService } from '../../services/empleado.service';

@Component({
  selector: 'app-empleado',
  templateUrl: './empleado.component.html',
  styleUrl: './empleado.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmployeeService],
})
export class EmpleadoComponent {
  readonly vm$ = this.empleadoService.vm$;
  constructor(public readonly empleadoService: EmployeeService) {}
}
