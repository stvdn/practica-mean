import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmpleadoComponent } from './components/empleado/empleado.component';
import { AuthDashboardComponent } from './features/auth/auth-dashboard.component';
import { authGuard } from './core/auth.guard';

const routes: Routes = [
  { path: 'auth/register', component: AuthDashboardComponent, data: { registering: true } },
  { path: 'auth', component: AuthDashboardComponent },
  { path: 'employees', component: EmpleadoComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'employees' },
  { path: '**', redirectTo: 'employees' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
