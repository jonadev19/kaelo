import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() user: User | null = null;
  @Output() save = new EventEmitter<Partial<User>>();
  @Output() close = new EventEmitter<void>();

  userForm = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    password: [''], // Not required for editing
  });

  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.user;
    if (this.isEditMode && this.user) {
      this.userForm.patchValue(this.user);
      // Password should not be required when editing
      this.userForm.get('password')?.clearValidators();
    } else {
      // Password is required for new users
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }

    const formValue = this.userForm.getRawValue();
    const userData: Partial<User> = {
      full_name: formValue.full_name!,
      email: formValue.email!,
      role: formValue.role as User['role'],
    };

    if (!this.isEditMode && formValue.password) {
      // This is tricky with Supabase, as we can't set a password directly.
      // The service will need to handle the user creation via Supabase Auth.
      // For now, we pass it.
      // In a real scenario, the `createUser` in the service would call `signUp`.
      (userData as any).password = formValue.password;
    }

    this.save.emit(userData);
  }

  onClose(): void {
    this.close.emit();
  }
}
