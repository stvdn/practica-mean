import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable, EMPTY, merge, defer } from 'rxjs';
import { catchError, concatMap, distinctUntilChanged, finalize, ignoreElements, map, shareReplay, startWith, tap } from 'rxjs/operators';
import { ApiResponse, Empleado, EmpleadoData } from '../models/empleado';
import { environment } from '../../environments/environment';

interface EmployeeState {
  readonly empleados: readonly Empleado[];
  readonly selected: Empleado | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly message: string | null;
  readonly formRevision: number;
}
type Command = { type: 'load' } | { type: 'save'; data: EmpleadoData; id?: string }
  | { type: 'delete'; id: string };

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly url = environment.apiUrl;
  private readonly state = new BehaviorSubject<EmployeeState>({
    empleados: [], selected: null, loading: false, error: null, message: null, formRevision: 0,
  });
  private readonly commands = new Subject<Command>();
  readonly empleados$ = this.state.asObservable().pipe(map(s => s.empleados), distinctUntilChanged());
  readonly loading$ = this.state.asObservable().pipe(map(s => s.loading), distinctUntilChanged());
  readonly error$ = this.state.asObservable().pipe(map(s => s.error), distinctUntilChanged());
  readonly vm$: Observable<EmployeeState>;

  constructor(private readonly http: HttpClient, @Inject(PLATFORM_ID) platformId: object) {
    // async pipe owns the subscription. Commands run sequentially and errors do not end the stream.
    const effects$ = isPlatformBrowser(platformId) ? this.commands.pipe(
      startWith({ type: 'load' } as Command),
      concatMap(command => defer(() => {
        this.patch({ loading: true, error: null, message: null });
        return this.execute(command).pipe(
          catchError((error: unknown) => {
            this.patch({ error: this.errorMessage(error) });
            return EMPTY;
          }),
          finalize(() => this.patch({ loading: false })),
        );
      })),
      ignoreElements(),
    ) : EMPTY;
    this.vm$ = merge(this.state.asObservable(), effects$).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  load(): void { this.commands.next({ type: 'load' }); }
  save(data: EmpleadoData): void {
    const id = this.state.value.selected?._id;
    this.commands.next({ type: 'save', data: { ...data }, ...(id ? { id } : {}) });
  }
  select(employee: Empleado): void {
    this.patch({ selected: { ...employee }, error: null, message: null });
  }
  cancel(): void {
    this.patch({ selected: null, error: null, formRevision: this.state.value.formRevision + 1 });
  }
  delete(id: string): void { this.commands.next({ type: 'delete', id }); }

  private execute(command: Command): Observable<unknown> {
    if (command.type === 'load') return this.http.get<ApiResponse<Empleado[]>>(this.url).pipe(
      map(response => this.unwrap(response)),
      tap(empleados => this.patch({ empleados: empleados.map(e => ({ ...e })) })),
    );
    if (command.type === 'delete') return this.http.delete<ApiResponse<Empleado>>(`${this.url}/${command.id}`).pipe(
      map(response => this.unwrap(response)),
      tap(() => {
        const current = this.state.value;
        this.patch({ empleados: current.empleados.filter(e => e._id !== command.id),
          ...(current.selected?._id === command.id
            ? { selected: null, formRevision: current.formRevision + 1 } : {}),
          message: 'Empleado eliminado',
        });
      }),
    );
    const request = command.id
      ? this.http.put<ApiResponse<Empleado>>(`${this.url}/${command.id}`, command.data)
      : this.http.post<ApiResponse<Empleado>>(this.url, command.data);
    return request.pipe(map(response => this.unwrap(response)), tap(employee => {
      const current = this.state.value;
      this.patch({ empleados: command.id
        ? current.empleados.map(e => e._id === employee._id ? { ...employee } : e)
        : [...current.empleados, { ...employee }],
        selected: null, formRevision: current.formRevision + 1,
        message: command.id ? 'Empleado actualizado' : 'Empleado creado',
      });
    }));
  }
  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === null) throw new Error(response.message);
    return response.data;
  }
  private patch(change: Partial<EmployeeState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as Partial<ApiResponse<unknown>> | null;
      if (body && typeof body.message === 'string') {
        const details = Array.isArray(body.errors)
          ? body.errors.map(e => `${e.field || 'datos'}: ${e.message}`).join('; ') : '';
        return details ? `${body.message}. ${details}` : body.message;
      }
      return 'No se pudo conectar con el servidor. Intente nuevamente.';
    }
    return error instanceof Error ? error.message : 'No se pudo completar la operación';
  }
}
// Compatibility for existing imports in the project.
export { EmployeeService as EmpleadoService };
