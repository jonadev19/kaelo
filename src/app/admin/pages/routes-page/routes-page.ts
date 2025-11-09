import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Route {
  id: number;
  name: string;
  distance: string;
  difficulty: 'fácil' | 'intermedia' | 'difícil';
  creator: string;
}

@Component({
  selector: 'app-routes-page',
  standalone: true,
  templateUrl: './routes-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutesPage {
  routes: Route[] = [
    {
      id: 1,
      name: 'Ruta del Sol',
      distance: '25 km',
      difficulty: 'intermedia',
      creator: 'Laura Rodríguez',
    },
    {
      id: 2,
      name: 'Paseo por el Bosque',
      distance: '10 km',
      difficulty: 'fácil',
      creator: 'Juan Pérez',
    },
    {
      id: 3,
      name: 'Montaña Desafiante',
      distance: '40 km',
      difficulty: 'difícil',
      creator: 'Laura Rodríguez',
    },
  ];
}