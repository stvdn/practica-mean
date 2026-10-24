import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Credentials } from '../../core/auth.models';

@Component({ selector: 'app-auth-form', templateUrl: './auth-form.component.html' })
export class AuthFormComponent {
  @Input() registering = false;
  @Input() busy = false;
  @Output() submitCredentials = new EventEmitter<Credentials>();
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6),
      control => new TextEncoder().encode(control.value ?? '').length > 72 ? { maxBytes: true } : null] }),
  });

  submit(): void {
    if (this.busy) return;
    this.form.markAllAsTouched();
    if (this.form.valid) this.submitCredentials.emit(this.form.getRawValue());
  }
}
