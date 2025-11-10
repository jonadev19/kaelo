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
import { Store, StorePayload, StoreStatus } from '../../../shared/interfaces/store.interface';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './store-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() store: Store | null = null;
  @Input() merchants: User[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<StorePayload>();
  @Output() close = new EventEmitter<void>();

  readonly statusOptions: { label: string; value: StoreStatus }[] = [
    { label: 'Pendiente de aprobación', value: 'pendiente_aprobacion' },
    { label: 'Aprobado', value: 'aprobado' },
    { label: 'Rechazado', value: 'rechazado' },
    { label: 'Inactivo', value: 'inactivo' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    owner_id: ['', Validators.required],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
    phone: [''],
    address: [''],
    status: ['pendiente_aprobacion', Validators.required],
    description: [''],
    logo_url: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['store']) {
      if (this.store) {
        this.form.reset({
          name: this.store.name,
          owner_id: this.store.owner_id,
          phone: this.store.phone ?? '',
          address: this.store.address ?? '',
          status: this.store.status,
          description: this.store.description ?? '',
          logo_url: this.store.logo_url ?? '',
          ...this.extractLatLng(this.store.location),
        });
      } else {
        this.form.reset({
          name: '',
          owner_id: '',
          latitude: null,
          longitude: null,
          phone: '',
          address: '',
          status: 'pendiente_aprobacion',
          description: '',
          logo_url: '',
        });
      }
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: StorePayload = {
      name: value.name!,
      owner_id: value.owner_id!,
      location: this.buildPoint(value.latitude!, value.longitude!),
      phone: value.phone || null,
      address: value.address || null,
      status: value.status!,
      description: value.description || null,
      logo_url: value.logo_url || null,
    };

    this.save.emit(payload);
  }

  onClose() {
    this.close.emit();
  }

  private extractLatLng(location: unknown) {
    if (location && typeof location === 'object') {
      if (
        'type' in location &&
        (location as any).type === 'Point' &&
        Array.isArray((location as any).coordinates)
      ) {
        const [lng, lat] = (location as any).coordinates;
        return { latitude: lat ?? null, longitude: lng ?? null };
      }
    } else if (typeof location === 'string') {
      const match = location.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        const [, lng, lat] = match;
        return { latitude: Number(lat), longitude: Number(lng) };
      }
    }

    return { latitude: null, longitude: null };
  }

  private buildPoint(lat: number, lng: number) {
    return `POINT(${Number(lng)} ${Number(lat)})`;
  }
}
