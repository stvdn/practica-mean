import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EmpleadoComponent } from './components/empleado/empleado.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { EmpleadoFormComponent } from './components/empleado-form/empleado-form.component';
import { EmpleadoTableComponent } from './components/empleado-table/empleado-table.component';
import { EmpleadoService } from './services/empleado.service';
import { AuthDashboardComponent } from './features/auth/auth-dashboard.component';
import { AuthFormComponent } from './features/auth/auth-form.component';
import { AuthInterceptor } from './core/auth.interceptor';
import { SessionBarComponent } from './core/session-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    EmpleadoComponent,
    EmpleadoFormComponent,
    EmpleadoTableComponent,
    AuthDashboardComponent,
    AuthFormComponent,
    SessionBarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideClientHydration(),
    EmpleadoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
