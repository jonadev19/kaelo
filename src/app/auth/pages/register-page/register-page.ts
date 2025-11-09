import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { passwordMatcher } from './password-matcher';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register-page.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatcher }
  );

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    const { fullName, email, password, role } = this.registerForm.getRawValue();

    if (fullName && email && password && role) {
      try {
        await this.authService.register(email, password, fullName, role);
        this.router.navigate(['/login']);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
