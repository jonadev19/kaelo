import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Business {
  id: number;
  name: string;
  owner: string;
  category: string;
  status: 'verificado' | 'pendiente';
}

@Component({
  selector: 'app-businesses-page',
  standalone: true,
  templateUrl: './businesses-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessesPage {
  businesses: Business[] = [
    {
      id: 1,
      name: 'Café El Sol',
      owner: 'Carlos Sánchez',
      category: 'cafetería',
      status: 'verificado',
    },
    {
      id: 2,
      name: 'Tienda de Bicis La Rueda',
      owner: 'Ana Gómez',
      category: 'tienda_bicicletas',
      status: 'verificado',
    },
    {
      id: 3,
      name: 'Restaurante La Montaña',
      owner: 'Juan Pérez',
      category: 'restaurante',
      status: 'pendiente',
    },
  ];
}