import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking.store';
import { PassengerDetails, PassengerType } from '../core/booking.models';

@Component({
  selector: 'app-passenger-details-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './passenger-details-page.component.html',
  styleUrl: './passenger-details-page.component.scss'
})
export class PassengerDetailsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);

  protected readonly passengerManifest = this.buildManifest();
  protected readonly form = this.formBuilder.group({
    contact: this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      receiveAlerts: [true]
    }),
    passengers: this.formBuilder.array([])
  });

  constructor() {
    if (!this.store.itineraryComplete()) {
      void this.router.navigate(['/search']);
      return;
    }

    const savedPassengers = this.store.selectedPassengers();
    const savedContact = this.store.draft().contact;

    this.passengerManifest.forEach((type, index) => {
      const saved = savedPassengers[index];
      this.passengerArray.push(this.createPassengerGroup(type, saved));
    });

    if (savedContact) {
      this.form.get('contact')?.patchValue(savedContact);
    }
  }

  protected get passengerArray(): FormArray {
    return this.form.get('passengers') as FormArray;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const contact = this.form.get('contact')?.getRawValue();
    const passengers = this.passengerArray.controls.map(
      (control) => control.getRawValue() as PassengerDetails
    );

    this.store.savePassengerDetails(passengers, {
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      city: contact.city ?? '',
      receiveAlerts: Boolean(contact.receiveAlerts)
    });

    void this.router.navigate(['/seats']);
  }

  protected controlInvalid(control: AbstractControl | null): boolean {
    return Boolean(control?.invalid && control?.touched);
  }

  private buildManifest(): PassengerType[] {
    const passengers = this.store.activeSearch().passengers;
    return [
      ...Array.from({ length: passengers.adults }, () => 'Adult' as const),
      ...Array.from({ length: passengers.children }, () => 'Child' as const),
      ...Array.from({ length: passengers.infants }, () => 'Infant' as const)
    ];
  }

  private createPassengerGroup(type: PassengerType, saved?: PassengerDetails) {
    return this.formBuilder.group({
      passengerType: [saved?.passengerType ?? type],
      title: [saved?.title ?? (type === 'Adult' ? 'Mr' : 'Master'), Validators.required],
      firstName: [saved?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [saved?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
      gender: [saved?.gender ?? 'Male', Validators.required],
      dateOfBirth: [saved?.dateOfBirth ?? '', Validators.required],
      mealPreference: [saved?.mealPreference ?? 'No meal', Validators.required],
      frequentFlyerId: [saved?.frequentFlyerId ?? '']
    });
  }
}
