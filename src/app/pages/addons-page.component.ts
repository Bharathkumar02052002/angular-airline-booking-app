import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
  protected readonly bundleSuggestion = computed(() => {
    const flights = this.store.selectedFlights();
    const passengers = this.store.activeSearch().passengers;
    const international = flights.some((flight) => flight.destination === 'DXB' || flight.destination === 'SIN');
    const familyTrip = passengers.children > 0 || passengers.infants > 0;

    if (international) {
      return {
        title: 'International travel bundle',
        description: 'Extra baggage, flexi changes, and insurance are the strongest fit for this route.',
        patch: {
          baggageOption: '20kg',
          mealBundle: 'Comfort Meal',
          loungeAccess: true,
          priorityServices: true,
          flexiChange: true,
          insuranceCover: true
        } as const
      };
    }

    if (familyTrip) {
      return {
        title: 'Family travel bundle',
        description: 'Priority services and baggage usually make family trips easier to manage.',
        patch: {
          baggageOption: '20kg',
          mealBundle: 'Regional Meal',
          loungeAccess: false,
          priorityServices: true,
          flexiChange: true,
          insuranceCover: true
        } as const
      };
    }

    return {
      title: 'Light domestic bundle',
      description: 'A smaller bundle keeps the cost down while still protecting the trip.',
      patch: {
        baggageOption: '15kg',
        mealBundle: 'Comfort Meal',
        loungeAccess: false,
        priorityServices: false,
        flexiChange: true,
        insuranceCover: false
      } as const
    };
  });
  protected readonly selectedAddonCount = computed(() => {
    const value = this.form.getRawValue();
    return [
      value.baggageOption !== 'None',
      value.mealBundle !== 'None',
      Boolean(value.loungeAccess),
      Boolean(value.priorityServices),
      Boolean(value.flexiChange),
      Boolean(value.insuranceCover)
    ].filter(Boolean).length;
  });

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

  protected applySuggestedBundle(): void {
    this.form.patchValue(this.bundleSuggestion().patch);
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
