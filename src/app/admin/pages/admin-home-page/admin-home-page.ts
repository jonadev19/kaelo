import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AdminDashboardService } from '../../../shared/services/admin-dashboard.service';
import { AdminStats, TransactionSummary } from '../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-admin-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHomePage implements OnInit {
  private readonly dashboardService = inject(AdminDashboardService);

  readonly stats = signal<AdminStats | null>(null);
  readonly recentTransactions = signal<TransactionSummary[]>([]);
  readonly loadingStats = signal(false);
  readonly loadingTransactions = signal(false);

  async ngOnInit() {
    await Promise.all([this.loadStats(), this.loadTransactions()]);
  }

  private async loadStats() {
    this.loadingStats.set(true);
    try {
      const stats = await this.dashboardService.getStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      this.loadingStats.set(false);
    }
  }

  private async loadTransactions() {
    this.loadingTransactions.set(true);
    try {
      const transactions = await this.dashboardService.getRecentTransactions();
      this.recentTransactions.set(transactions);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    } finally {
      this.loadingTransactions.set(false);
    }
  }
}
