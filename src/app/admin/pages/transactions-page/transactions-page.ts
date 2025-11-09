import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Transaction {
  id: string;
  user: string;
  business: string;
  amount: string;
  date: string;
  status: 'completada' | 'pendiente' | 'fallida';
}

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  templateUrl: './transactions-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage {
  transactions: Transaction[] = [
    {
      id: 'txn_12345',
      user: 'Juan Pérez',
      business: 'Café El Sol',
      amount: '5.00',
      date: '2025-11-08',
      status: 'completada',
    },
    {
      id: 'txn_12346',
      user: 'Ana Gómez',
      business: 'Tienda de Bicis La Rueda',
      amount: '20.50',
      date: '2025-11-08',
      status: 'completada',
    },
    {
      id: 'txn_12347',
      user: 'Carlos Sánchez',
      business: 'Restaurante La Montaña',
      amount: '$75.20',
      date: '2025-11-07',
      status: 'pendiente',
    },
    {
      id: 'txn_12348',
      user: 'Laura Rodríguez',
      business: 'Café El Sol',
      amount: '$5.75',
      date: '2025-11-07',
      status: 'fallida',
    },
  ];
}