import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingStore } from '../core/booking.store';
import { FlightOption, SearchLeg } from '../core/booking.models';

@Component({
  selector: 'app-search-results-page',
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './search-results-page.component.html',
  styleUrl: './search-results-page.component.scss'
})
export class SearchResultsPageComponent {
  private readonly router = inject(Router);
  private readonly selectedSort = signal<'price' | 'departure' | 'duration'>('price');
  private readonly selectedFare = signal<'all' | FlightOption['fareFamily']>('all');
  private readonly minimumSeats = signal<0 | 5 | 10>(0);
  private readonly compareIds = signal<string[]>([]);
  protected readonly store = inject(BookingStore);

  protected readonly search = this.store.activeSearch;
  protected readonly selectedFlights = this.store.selectedFlights;
  protected readonly currentLegIndex = computed(() => this.selectedFlights().length);
  protected readonly currentLeg = computed<SearchLeg | undefined>(
    () => this.search().legs[this.currentLegIndex()]
  );
  protected readonly flightOptions = computed(() => {
    const leg = this.currentLeg();
    return leg ? this.store.getFlightsForLeg(leg.origin, leg.destination, leg.date) : [];
  });
  protected readonly flexibleDateOptions = computed(() => {
    const leg = this.currentLeg();
    if (!leg) {
      return [];
    }

    return [-2, -1, 0, 1, 2].map((offset) => {
      const date = this.shiftDate(leg.date, offset);
      const flights = this.store.getFlightsForLeg(leg.origin, leg.destination, date);
      const cheapestTotal = flights.length
        ? Math.min(...flights.map((flight) => flight.baseFare + flight.taxes))
        : null;

      return {
        date,
        offset,
        active: date === leg.date,
        flightsCount: flights.length,
        cheapestTotal
      };
    });
  });
  protected readonly visibleFlights = computed(() => {
    const fare = this.selectedFare();
    const minSeats = this.minimumSeats();
    const flights = this.flightOptions().filter((flight) => {
      if (fare !== 'all' && flight.fareFamily !== fare) {
        return false;
      }

      return flight.seatsLeft >= minSeats;
    });

    return [...flights].sort((left, right) => {
      switch (this.selectedSort()) {
        case 'departure':
          return left.departureTime.localeCompare(right.departureTime);
        case 'duration':
          return this.durationToMinutes(left.duration) - this.durationToMinutes(right.duration);
        case 'price':
        default:
          return left.baseFare + left.taxes - (right.baseFare + right.taxes);
      }
    });
  });
  protected readonly comparedFlights = computed(() => {
    const ids = this.compareIds();
    return ids
      .map((id) => this.flightOptions().find((flight) => flight.id === id))
      .filter((flight): flight is FlightOption => Boolean(flight));
  });
  protected readonly recommendedFlights = computed(() => {
    const flights = this.visibleFlights();
    if (!flights.length) {
      return [];
    }

    const cheapest = [...flights].sort(
      (left, right) => left.baseFare + left.taxes - (right.baseFare + right.taxes)
    )[0];
    const fastest = [...flights].sort(
      (left, right) => this.durationToMinutes(left.duration) - this.durationToMinutes(right.duration)
    )[0];
    const greenest = [...flights].sort((left, right) => left.carbonKg - right.carbonKg)[0];

    return [
      {
        label: 'Best fare',
        note: 'Lowest total for this filter set',
        flight: cheapest
      },
      {
        label: 'Fastest',
        note: 'Shortest travel time',
        flight: fastest
      },
      {
        label: 'Lower carbon',
        note: 'Lightest estimated footprint',
        flight: greenest
      }
    ];
  });

  constructor() {
    if (!this.search().legs.length) {
      void this.router.navigate(['/']);
    }
  }

  protected chooseFlight(flight: FlightOption): void {
    this.store.selectFlight(flight);
    this.compareIds.set([]);

    if (this.store.itineraryComplete()) {
      void this.router.navigate(['/travellers']);
      return;
    }
  }

  protected changeLeg(index: number): void {
    this.store.trimSelections(index);
  }

  protected continueIfReady(): void {
    if (this.store.itineraryComplete()) {
      void this.router.navigate(['/travellers']);
    }
  }

  protected setSort(value: 'price' | 'departure' | 'duration'): void {
    this.selectedSort.set(value);
  }

  protected setFareFilter(value: 'all' | FlightOption['fareFamily']): void {
    this.selectedFare.set(value);
  }

  protected setMinimumSeats(value: 0 | 5 | 10): void {
    this.minimumSeats.set(value);
  }

  protected resetFilters(): void {
    this.selectedSort.set('price');
    this.selectedFare.set('all');
    this.minimumSeats.set(0);
    this.compareIds.set([]);
  }

  protected applyFlexibleDate(date: string): void {
    const currentIndex = this.currentLegIndex();
    this.store.updateLegDate(currentIndex, date);
    this.compareIds.set([]);
  }

  protected toggleCompare(flightId: string): void {
    const current = this.compareIds();
    if (current.includes(flightId)) {
      this.compareIds.set(current.filter((id) => id !== flightId));
      return;
    }

    if (current.length >= 2) {
      this.compareIds.set([current[1], flightId]);
      return;
    }

    this.compareIds.set([...current, flightId]);
  }

  protected isCompared(flightId: string): boolean {
    return this.compareIds().includes(flightId);
  }

  protected canAddToCompare(flightId: string): boolean {
    return this.isCompared(flightId) || this.compareIds().length < 2;
  }

  protected passengerSummary(): string {
    const passengers = this.search().passengers;
    return `${passengers.adults} Adult${passengers.adults > 1 ? 's' : ''}, ${passengers.children} Child, ${passengers.infants} Infant`;
  }

  protected currentSort(): 'price' | 'departure' | 'duration' {
    return this.selectedSort();
  }

  protected currentFareFilter(): 'all' | FlightOption['fareFamily'] {
    return this.selectedFare();
  }

  protected currentMinSeats(): 0 | 5 | 10 {
    return this.minimumSeats();
  }

  private durationToMinutes(duration: string): number {
    const [hoursPart, minutesPart] = duration.split(' ');
    const hours = Number.parseInt(hoursPart.replace('h', ''), 10);
    const minutes = Number.parseInt(minutesPart.replace('m', ''), 10);

    return hours * 60 + minutes;
  }

  private shiftDate(dateValue: string, days: number): string {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
