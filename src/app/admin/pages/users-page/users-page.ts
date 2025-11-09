import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/interfaces/user.interface';
import { UserService } from '../../../shared/services/user.service';
import { UserFormComponent } from '../../components/user-form/user-form.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, UserFormComponent],
  templateUrl: './users-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage implements OnInit {
  public users = signal<User[]>([]);
  private userService = inject(UserService);

  public isModalOpen = signal(false);
  public editingUser = signal<User | null>(null);

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const users = await this.userService.getUsers();
      this.users.set(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  openCreateModal() {
    this.editingUser.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.editingUser.set(user);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async handleSave(userData: Partial<User>) {
    try {
      if (this.editingUser()) {
        // Update user
        await this.userService.updateUser(this.editingUser()!.id, userData);
      } else {
        // Create user
        await this.userService.createUser(userData);
      }
      this.closeModal();
      await this.loadUsers(); // Refresh list
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await this.userService.deleteUser(userId);
        await this.loadUsers();
      } catch (error) {
        console.error('Error deactivating user:', error);
      }
    }
  }
}