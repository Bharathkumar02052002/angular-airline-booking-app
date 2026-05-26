import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking.store';
import { PaymentMode, PaymentStatus } from '../core/booking.models';

@Component({
  selector: 'app-payment-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-page.component.html',
  styleUrl: './payment-page.component.scss'
})
export class PaymentPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);
  protected processing = false;

  protected readonly form = this.formBuilder.group({
    paymentMode: ['UPI' as PaymentMode, Validators.required],
    paymentStatus: ['Success' as PaymentStatus, Validators.required],
    payerName: ['', [Validators.required, Validators.minLength(3)]],
    billingEmail: [this.store.draft().contact?.email ?? '', [Validators.required, Validators.email]],
    acceptTerms: [false, Validators.requiredTrue]
  });

  constructor() {
    if (!this.store.draft().addons) {
      void this.router.navigate(['/addons']);
    }
  }

  protected payNow(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.processing = true;
    const mode = this.form.get('paymentMode')?.value as PaymentMode;
    const status = this.form.get('paymentStatus')?.value as PaymentStatus;

    this.store.setPayment(mode, status);
    const booking = this.store.completeBooking();
    this.processing = false;

    if (booking) {
      void this.router.navigate(['/confirmation', booking.pnr]);
    }
  }
}
