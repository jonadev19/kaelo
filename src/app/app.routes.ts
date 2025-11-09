import { Routes } from '@angular/router';
import { LoginPage } from './auth/pages/login-page/login-page';
import { RegisterPage } from './auth/pages/register-page/register-page';
import { HomePage } from './dashboard/pages/home-page/home-page';
import { AdminHomePage } from './admin/pages/admin-home-page/admin-home-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'dashboard/home-page', component: HomePage },
  { path: 'admin/home-page', component: AdminHomePage },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
