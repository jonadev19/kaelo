import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouteFormComponent } from '../../components/route-form/route-form.component';
import { RoutePayload, RouteSummary } from '../../../shared/interfaces/route.interface';
import { RouteService } from '../../../shared/services/route.service';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-routes-page',
  standalone: true,
  imports: [CommonModule, RouteFormComponent],
  templateUrl: './routes-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutesPage implements OnInit {
  private readonly routeService = inject(RouteService);
  private readonly userService = inject(UserService);
  private readonly statusLabelMap = {
    borrador: 'Borrador',
    pendiente_aprobacion: 'Pendiente de aprobación',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    inactiva: 'Inactiva',
  } as const;

  readonly routes = signal<RouteSummary[]>([]);
  readonly creators = signal<User[]>([]);
  readonly isModalOpen = signal(false);
  readonly editingRoute = signal<RouteSummary | null>(null);
  readonly searchTerm = signal('');
  readonly loadingRoutes = signal(false);
  readonly savingRoute = signal(false);

  readonly filteredRoutes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.routes();
    }

    return this.routes().filter((route) => {
      const creatorName = route.creator?.full_name?.toLowerCase() ?? '';
      return (
        route.title.toLowerCase().includes(term) ||
        creatorName.includes(term) ||
        route.status?.toLowerCase().includes(term)
      );
    });
  });

  async ngOnInit() {
    await Promise.all([this.loadRoutes(), this.loadCreators()]);
  }

  async loadRoutes() {
    this.loadingRoutes.set(true);
    try {
      const data = await this.routeService.getRoutes();
      this.routes.set(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      this.loadingRoutes.set(false);
    }
  }

  async loadCreators() {
    try {
      const data = await this.userService.getRouteCreators();
      this.creators.set(data);
    } catch (error) {
      console.error('Error loading route creators:', error);
    }
  }

  openCreateModal() {
    this.editingRoute.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(route: RouteSummary) {
    this.editingRoute.set(route);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingRoute.set(null);
  }

  handleSearch(term: string) {
    this.searchTerm.set(term);
  }

  async handleSave(routeData: RoutePayload) {
    const editing = this.editingRoute();
    this.savingRoute.set(true);

    try {
      if (editing) {
        await this.routeService.updateRoute(editing.id, routeData);
      } else {
        await this.routeService.createRoute(routeData);
      }

      await this.loadRoutes();
      this.closeModal();
    } catch (error) {
      console.error('Error saving route:', error);
    } finally {
      this.savingRoute.set(false);
    }
  }

  async deleteRoute(route: RouteSummary) {
    const confirmed = confirm(`¿Eliminar la ruta "${route.title}" de forma permanente?`);
    if (!confirmed) {
      return;
    }

    try {
      await this.routeService.deleteRoute(route.id);
      await this.loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  }

  formatStatus(status: string) {
    return (
      this.statusLabelMap[status as keyof typeof this.statusLabelMap] ?? this.toTitleCase(status)
    );
  }

  private toTitleCase(value: string) {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
