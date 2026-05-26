import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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

  constructor() {
    if (!this.search().legs.length) {
      void this.router.navigate(['/']);
    }
  }

  protected chooseFlight(flight: FlightOption): void {
    this.store.selectFlight(flight);

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

  protected passengerSummary(): string {
    const passengers = this.search().passengers;
    return `${passengers.adults} Adult${passengers.adults > 1 ? 's' : ''}, ${passengers.children} Child, ${passengers.infants} Infant`;
  }
}
