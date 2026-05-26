import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking.store';

@Component({
  selector: 'app-addons-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addons-page.component.html',
  styleUrl: './addons-page.component.scss'
})
export class AddonsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);

  protected readonly form = this.formBuilder.group({
    baggageOption: [this.store.draft().addons.baggageOption],
    mealBundle: [this.store.draft().addons.mealBundle],
    loungeAccess: [this.store.draft().addons.loungeAccess],
    priorityServices: [this.store.draft().addons.priorityServices],
    flexiChange: [this.store.draft().addons.flexiChange],
    insuranceCover: [this.store.draft().addons.insuranceCover]
  });

  constructor() {
    if (!this.store.draft().seats.length) {
      void this.router.navigate(['/seats']);
    }
  }

  protected saveAndContinue(): void {
    this.store.saveAddons({
      baggageOption: this.form.get('baggageOption')?.value ?? 'None',
      mealBundle: this.form.get('mealBundle')?.value ?? 'None',
      loungeAccess: Boolean(this.form.get('loungeAccess')?.value),
      priorityServices: Boolean(this.form.get('priorityServices')?.value),
      flexiChange: Boolean(this.form.get('flexiChange')?.value),
      insuranceCover: Boolean(this.form.get('insuranceCover')?.value)
    });

    void this.router.navigate(['/payment']);
  }
}
