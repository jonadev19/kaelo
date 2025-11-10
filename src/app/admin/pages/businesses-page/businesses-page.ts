import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { StoreFormComponent } from '../../components/store-form/store-form.component';
import { Store, StorePayload } from '../../../shared/interfaces/store.interface';
import { StoreService } from '../../../shared/services/store.service';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-businesses-page',
  standalone: true,
  imports: [CommonModule, StoreFormComponent],
  templateUrl: './businesses-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessesPage implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly userService = inject(UserService);

  readonly stores = signal<Store[]>([]);
  readonly merchants = signal<User[]>([]);
  readonly isModalOpen = signal(false);
  readonly editingStore = signal<Store | null>(null);
  readonly searchTerm = signal('');
  readonly loadingStores = signal(false);
  readonly savingStore = signal(false);

  readonly filteredStores = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.stores();
    }

    return this.stores().filter((store) => {
      const ownerName = store.owner?.full_name?.toLowerCase() ?? '';
      const ownerEmail = store.owner?.email?.toLowerCase() ?? '';
      return (
        store.name.toLowerCase().includes(term) ||
        ownerName.includes(term) ||
        ownerEmail.includes(term) ||
        store.status.toLowerCase().includes(term) ||
        (store.address ?? '').toLowerCase().includes(term)
      );
    });
  });

  async ngOnInit() {
    await Promise.all([this.loadStores(), this.loadMerchants()]);
  }

  async loadStores() {
    this.loadingStores.set(true);
    try {
      const data = await this.storeService.getStores();
      this.stores.set(data);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      this.loadingStores.set(false);
    }
  }

  async loadMerchants() {
    try {
      const data = await this.userService.getMerchants();
      this.merchants.set(data);
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  }

  openCreateModal() {
    this.editingStore.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(store: Store) {
    this.editingStore.set(store);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingStore.set(null);
  }

  handleSearch(term: string) {
    this.searchTerm.set(term);
  }

  async handleSave(payload: StorePayload) {
    const editing = this.editingStore();
    this.savingStore.set(true);

    try {
      if (editing) {
        await this.storeService.updateStore(editing.id, payload);
      } else {
        await this.storeService.createStore(payload);
      }

      await this.loadStores();
      this.closeModal();
    } catch (error) {
      console.error('Error saving store:', error);
    } finally {
      this.savingStore.set(false);
    }
  }

  async deleteStore(store: Store) {
    const confirmed = confirm(`¿Eliminar el comercio "${store.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await this.storeService.deleteStore(store.id);
      await this.loadStores();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  }

  formatStatus(status: string) {
    switch (status) {
      case 'pendiente_aprobacion':
        return 'Pendiente de aprobación';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'inactivo':
        return 'Inactivo';
      default:
        return status;
    }
  }
}
