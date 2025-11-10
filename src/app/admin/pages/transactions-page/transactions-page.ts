import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { Transaction, TransactionPayload } from '../../../shared/interfaces/transaction.interface';
import { TransactionService } from '../../../shared/services/transaction.service';
import { UserService } from '../../../shared/services/user.service';
import { RouteService } from '../../../shared/services/route.service';
import { User } from '../../../shared/interfaces/user.interface';
import { RouteSummary } from '../../../shared/interfaces/route.interface';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, TransactionFormComponent],
  templateUrl: './transactions-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly userService = inject(UserService);
  private readonly routeService = inject(RouteService);

  readonly transactions = signal<Transaction[]>([]);
  readonly users = signal<User[]>([]);
  readonly routes = signal<RouteSummary[]>([]);

  readonly isModalOpen = signal(false);
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly searchTerm = signal('');
  readonly loadingTransactions = signal(false);
  readonly savingTransaction = signal(false);

  readonly filteredTransactions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.transactions();
    }

    return this.transactions().filter((transaction) => {
      const userName = transaction.user?.full_name?.toLowerCase() ?? '';
      const userEmail = transaction.user?.email?.toLowerCase() ?? '';
      const routeTitle = transaction.route?.title?.toLowerCase() ?? '';
      return (
        transaction.id.toLowerCase().includes(term) ||
        userName.includes(term) ||
        userEmail.includes(term) ||
        routeTitle.includes(term) ||
        transaction.payment_status.toLowerCase().includes(term)
      );
    });
  });

  async ngOnInit() {
    await Promise.all([this.loadTransactions(), this.loadUsers(), this.loadRoutes()]);
  }

  async loadTransactions() {
    this.loadingTransactions.set(true);
    try {
      const data = await this.transactionService.getTransactions();
      this.transactions.set(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      this.loadingTransactions.set(false);
    }
  }

  async loadUsers() {
    try {
      const data = await this.userService.getUsers();
      this.users.set(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async loadRoutes() {
    try {
      const data = await this.routeService.getRoutes();
      this.routes.set(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  }

  openCreateModal() {
    this.editingTransaction.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(transaction: Transaction) {
    this.editingTransaction.set(transaction);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingTransaction.set(null);
  }

  handleSearch(term: string) {
    this.searchTerm.set(term);
  }

  async handleSave(payload: TransactionPayload) {
    const editing = this.editingTransaction();
    this.savingTransaction.set(true);

    try {
      if (editing) {
        await this.transactionService.updateTransaction(editing.id, payload);
      } else {
        await this.transactionService.createTransaction(payload);
      }

      await this.loadTransactions();
      this.closeModal();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      this.savingTransaction.set(false);
    }
  }

  async deleteTransaction(transaction: Transaction) {
    const confirmed = confirm(`¿Eliminar la transacción ${transaction.id}?`);
    if (!confirmed) {
      return;
    }

    try {
      await this.transactionService.deleteTransaction(transaction.id);
      await this.loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }

  formatStatus(status: string) {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'completada':
        return 'Completada';
      case 'fallida':
        return 'Fallida';
      case 'reembolsada':
        return 'Reembolsada';
      default:
        return status;
    }
  }
}
