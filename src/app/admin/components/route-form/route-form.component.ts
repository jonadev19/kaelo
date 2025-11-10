import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoutePayload, RouteSummary } from '../../../shared/interfaces/route.interface';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './route-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() route: RouteSummary | null = null;
  @Input() creators: User[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<RoutePayload>();
  @Output() close = new EventEmitter<void>();

  readonly difficultyOptions = [
    { label: 'Fácil', value: 'facil' },
    { label: 'Moderada', value: 'moderado' },
    { label: 'Difícil', value: 'dificil' },
    { label: 'Experta', value: 'experto' },
  ];

  readonly statusOptions = [
    { label: 'Borrador', value: 'borrador' },
    { label: 'Pendiente de aprobación', value: 'pendiente_aprobacion' },
    { label: 'Aprobada', value: 'aprobada' },
    { label: 'Rechazada', value: 'rechazada' },
    { label: 'Inactiva', value: 'inactiva' },
  ];

  routeForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    distance_km: [null as number | null, [Validators.required, Validators.min(0.1)]],
    difficulty: ['facil', [Validators.required]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    status: ['borrador', [Validators.required]],
    creator_id: ['', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['route']) {
      if (this.route) {
        this.routeForm.reset({
          title: this.route.title,
          description: this.route.description ?? '',
          distance_km: this.route.distance_km,
          difficulty: this.route.difficulty,
          price: this.route.price,
          status: this.route.status,
          creator_id: this.route.creator_id,
        });
      } else {
        this.routeForm.reset({
          title: '',
          description: '',
          distance_km: null,
          difficulty: 'facil',
          price: null,
          status: 'borrador',
          creator_id: '',
        });
      }
    }
  }

  onSubmit(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    const formValue = this.routeForm.getRawValue();
    const payload: RoutePayload = {
      title: formValue.title!,
      description: formValue.description ?? '',
      distance_km: Number(formValue.distance_km),
      difficulty: formValue.difficulty!,
      price: Number(formValue.price),
      status: formValue.status!,
      creator_id: formValue.creator_id!,
    };

    this.save.emit(payload);
  }

  onClose(): void {
    this.close.emit();
  }
}
