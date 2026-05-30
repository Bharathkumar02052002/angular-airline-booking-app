import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FEATURED_DEALS } from '../core/airport-data';
import { BookingStore } from '../core/booking.store';
import { CabinClass, FlightSearch, SearchLeg, TripType } from '../core/booking.models';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);

  protected readonly tripTypes: Array<{ value: TripType; label: string }> = [
    { value: 'one-way', label: 'One-way' },
    { value: 'round-trip', label: 'Round-trip' },
    { value: 'multi-city', label: 'Multi-city' }
  ];
  protected readonly cabinClasses: CabinClass[] = ['Economy', 'Premium Economy', 'Business'];
  protected readonly highlights = [
    'One-way, round-trip, and multi-city search',
    'Seat map with zone-based pricing',
    'Add-ons and payment state handling',
    'PNR lookup with saved bookings'
  ];
  protected readonly featuredDeals = FEATURED_DEALS;
  protected routeError = '';

  protected readonly form = this.formBuilder.group({
    tripType: ['one-way' as TripType, Validators.required],
    cabin: ['Economy' as CabinClass, Validators.required],
    adults: [1, [Validators.required, Validators.min(1), Validators.max(6)]],
    children: [0, [Validators.min(0), Validators.max(4)]],
    infants: [0, [Validators.min(0), Validators.max(2)]],
    promoCode: [''],
    returnDate: [this.getFutureDate(5)],
    legs: this.formBuilder.array([this.createLegGroup('DEL', 'BOM', this.getFutureDate(2))])
  });

  constructor() {
    this.applySearchToForm(this.store.activeSearch());
  }

  protected get legControls(): FormArray {
    return this.form.get('legs') as FormArray;
  }

  protected get stats(): Array<{ label: string; value: string }> {
    return [
      { label: 'Airports', value: `${this.store.airports.length}` },
      { label: 'Flight rows', value: `${this.store.flights.length}` },
      { label: 'Saved bookings', value: `${this.store.bookings().length}` },
      { label: 'Flow steps', value: '7' }
    ];
  }

  protected applyRecentSearch(search: FlightSearch): void {
    this.routeError = '';
    this.applySearchToForm(search);
  }

  protected recentSearchLabel(search: FlightSearch): string {
    const firstLeg = search.legs[0];
    const lastLeg = search.legs[search.legs.length - 1];
    const route = `${firstLeg.origin} - ${lastLeg.destination}`;

    return `${route} | ${search.tripType} | ${search.cabin}`;
  }

  protected recentSearchDates(search: FlightSearch): string {
    return search.legs.map((leg) => leg.date).join(' / ');
  }

  protected setTripType(type: TripType): void {
    this.form.patchValue({ tripType: type });

    if (type === 'one-way') {
      while (this.legControls.length > 1) {
        this.legControls.removeAt(this.legControls.length - 1);
      }
    }

    if (type === 'round-trip') {
      while (this.legControls.length > 1) {
        this.legControls.removeAt(this.legControls.length - 1);
      }

      const currentDate = this.legControls.at(0)?.get('date')?.value as string;
      this.form.patchValue({
        returnDate: this.form.get('returnDate')?.value || this.bumpDate(currentDate, 3)
      });
    }

    if (type === 'multi-city') {
      while (this.legControls.length < 2) {
        this.legControls.push(this.createLegGroup('BOM', 'GOI', this.getFutureDate(6)));
      }
    }
  }

  protected addLeg(): void {
    if (this.legControls.length >= 3) {
      return;
    }

    const lastLeg = this.legControls.at(this.legControls.length - 1)?.getRawValue() as SearchLeg;
    this.legControls.push(
      this.createLegGroup(lastLeg.destination || 'BOM', 'DEL', this.bumpDate(lastLeg.date, 2))
    );
  }

  protected removeLeg(index: number): void {
    if (this.legControls.length <= 2) {
      return;
    }

    this.legControls.removeAt(index);
  }

  protected swapLeg(index: number): void {
    const leg = this.legControls.at(index);
    const origin = leg.get('origin')?.value as string;
    const destination = leg.get('destination')?.value as string;
    leg.patchValue({
      origin: destination,
      destination: origin
    });
  }

  protected submitSearch(): void {
    this.routeError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const search = this.buildSearchPayload();
    if (!search) {
      return;
    }

    this.store.setSearch(search);
    void this.router.navigate(['/search']);
  }

  private applySearchToForm(search: FlightSearch): void {
    this.form.patchValue({
      tripType: search.tripType,
      cabin: search.cabin,
      adults: search.passengers.adults,
      children: search.passengers.children,
      infants: search.passengers.infants,
      promoCode: search.promoCode,
      returnDate: search.legs[1]?.date ?? this.getFutureDate(5)
    });

    while (this.legControls.length) {
      this.legControls.removeAt(0);
    }

    const baseLegs =
      search.tripType === 'round-trip'
        ? [search.legs[0]]
        : search.legs.length
          ? search.legs
          : [{ origin: 'DEL', destination: 'BOM', date: this.getFutureDate(2) }];

    baseLegs.forEach((leg) => {
      this.legControls.push(this.createLegGroup(leg.origin, leg.destination, leg.date));
    });
  }

  private buildSearchPayload(): FlightSearch | null {
    const raw = this.form.getRawValue();
    const tripType = raw.tripType as TripType;
    const legs = this.legControls.controls.map((control) => control.getRawValue() as SearchLeg);

    const adults = raw.adults ?? 1;
    const children = raw.children ?? 0;
    const infants = raw.infants ?? 0;

    if (infants > adults) {
      this.routeError = 'Infants cannot exceed the number of adults in the booking.';
      return null;
    }

    if (legs.some((leg) => !leg.origin || !leg.destination || leg.origin === leg.destination)) {
      this.routeError = 'Choose valid origin and destination pairs for every journey.';
      return null;
    }

    const normalizedLegs =
      tripType === 'round-trip'
        ? [
            legs[0],
            {
              origin: legs[0]?.destination ?? '',
              destination: legs[0]?.origin ?? '',
              date: raw.returnDate ?? this.bumpDate(legs[0]?.date ?? this.getFutureDate(2), 3)
            }
          ]
        : legs;

    return {
      tripType,
      cabin: raw.cabin as CabinClass,
      passengers: {
        adults,
        children,
        infants
      },
      promoCode: (raw.promoCode ?? '').trim().toUpperCase(),
      legs: normalizedLegs
    };
  }

  private createLegGroup(origin: string, destination: string, date: string) {
    return this.formBuilder.group({
      origin: [origin, Validators.required],
      destination: [destination, Validators.required],
      date: [date, Validators.required]
    });
  }

  private getFutureDate(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  private bumpDate(dateValue: string, offset: number): string {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }
}
