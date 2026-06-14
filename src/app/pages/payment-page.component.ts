import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
  protected readonly summary = this.store.priceSummary;
  protected readonly travellerCount = computed(() => {
    const passengers = this.store.activeSearch().passengers;
    return passengers.adults + passengers.children + passengers.infants;
  });
  protected readonly perTravellerCost = computed(() => {
    const count = this.travellerCount();
    return count ? Math.round(this.summary().total / count) : 0;
  });
  protected readonly paymentHint = computed(() => {
    const mode = this.form.get('paymentMode')?.value as PaymentMode;

    switch (mode) {
      case 'UPI':
        return 'Fastest path for the demo checkout and easiest to explain in a walkthrough.';
      case 'Card':
        return 'Best option to talk about tokenized payments and EMI support in a real app.';
      case 'Net Banking':
        return 'Useful for showing alternate payment rails in a booking product.';
      default:
        return '';
    }
  });

  protected readonly form = this.formBuilder.group({
    paymentMode: ['UPI' as PaymentMode, Validators.required],
    paymentStatus: ['Success' as PaymentStatus, Validators.required],
    payerName: ['', [Validators.required, Validators.minLength(3)]],
    billingEmail: [this.store.draft().contact?.email ?? '', [Validators.required, Validators.email]],
    acceptTerms: [false, Validators.requiredTrue]
  });

  constructor() {
    if (!this.store.draft().seats.length || !this.store.selectedPassengers().length) {
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
