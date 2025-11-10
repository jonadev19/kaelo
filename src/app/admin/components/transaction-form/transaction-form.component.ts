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
import { Transaction, TransactionPayload } from '../../../shared/interfaces/transaction.interface';
import { User } from '../../../shared/interfaces/user.interface';
import { RouteSummary } from '../../../shared/interfaces/route.interface';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() transaction: Transaction | null = null;
  @Input() users: User[] = [];
  @Input() routes: RouteSummary[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<TransactionPayload>();
  @Output() close = new EventEmitter<void>();

  readonly paymentStatusOptions = [
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Completado', value: 'completado' },
  ];

  readonly transactionTypeOptions = [
    { label: 'Compra de ruta', value: 'compra_ruta' },
    { label: 'Pedido de comercio', value: 'pedido_comercio' },
  ];

  form = this.fb.group({
    user_id: ['', Validators.required],
    transaction_type: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0)]],
    payment_status: ['pendiente', Validators.required],
    route_id: [''],
    payment_method: [''],
    payment_gateway_id: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction']) {
      if (this.transaction) {
        this.form.reset({
          user_id: this.transaction.user_id,
          transaction_type: this.transaction.transaction_type,
          amount: this.transaction.amount,
          payment_status: this.transaction.payment_status,
          route_id: this.transaction.route_id || '',
          payment_method: this.transaction.payment_method || '',
          payment_gateway_id: this.transaction.payment_gateway_id || '',
        });
      } else {
        this.form.reset({
          user_id: '',
          transaction_type: '',
          amount: null,
          payment_status: 'pendiente',
          route_id: '',
          payment_method: '',
          payment_gateway_id: '',
        });
      }
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: TransactionPayload = {
      user_id: raw.user_id!,
      transaction_type: raw.transaction_type!,
      amount: Number(raw.amount),
      payment_status: raw.payment_status!,
      route_id: raw.route_id || null,
      payment_method: raw.payment_method || null,
      payment_gateway_id: raw.payment_gateway_id || null,
    };

    this.save.emit(payload);
  }

  onClose() {
    this.close.emit();
  }
}
