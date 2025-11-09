import { ChangeDetectionStrategy, Component } from '@angular/core';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ciclista' | 'comerciante' | 'creador_ruta' | 'administrador';
  status: 'activo' | 'inactivo';
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  templateUrl: './users-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  users: User[] = [
    {
      id: 1,
      fullName: 'Juan Pérez',
      email: 'juan.perez@example.com',
      role: 'administrador',
      status: 'activo',
    },
    {
      id: 2,
      fullName: 'Ana Gómez',
      email: 'ana.gomez@example.com',
      role: 'ciclista',
      status: 'activo',
    },
    {
      id: 3,
      fullName: 'Carlos Sánchez',
      email: 'carlos.sanchez@example.com',
      role: 'comerciante',
      status: 'inactivo',
    },
    {
      id: 4,
      fullName: 'Laura Rodríguez',
      email: 'laura.rodriguez@example.com',
      role: 'creador_ruta',
      status: 'activo',
    },
  ];
}