import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookingStore } from '../core/booking.store';

@Component({
  selector: 'app-pnr-lookup-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pnr-lookup-page.component.html',
  styleUrl: './pnr-lookup-page.component.scss'
})
export class PnrLookupPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);
  protected searched = false;
  protected booking = this.store.getBookingByPnr('SB6Q2P');

  protected readonly form = this.formBuilder.group({
    pnr: ['SB6Q2P', [Validators.required, Validators.minLength(6)]],
    lastName: ['Raman', [Validators.required, Validators.minLength(2)]]
  });

  protected lookup(): void {
    this.searched = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const pnr = this.form.get('pnr')?.value ?? '';
    const lastName = this.form.get('lastName')?.value ?? '';
    const booking = this.store.findBookingByPnrAndLastName(pnr, lastName);

    this.booking = booking;

    if (booking) {
      void this.router.navigate(['/my-trips', booking.pnr]);
    }
  }
}
