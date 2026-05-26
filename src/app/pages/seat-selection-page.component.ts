import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookingStore } from '../core/booking.store';
import { SeatSelection, SeatZone } from '../core/booking.models';

@Component({
  selector: 'app-seat-selection-page',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './seat-selection-page.component.html',
  styleUrl: './seat-selection-page.component.scss'
})
export class SeatSelectionPageComponent {
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);
  protected readonly rows = Array.from({ length: 12 }, (_, index) => index + 1);
  protected readonly seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  protected activePassengerIndex = 0;
  protected readonly passengers = this.store.selectedPassengers;
  protected readonly selectedSeats = computed(() => this.store.draft().seats);
  protected readonly primaryFlight = computed(() => this.store.selectedFlights()[0]);

  constructor() {
    if (!this.store.selectedPassengers().length) {
      void this.router.navigate(['/travellers']);
    }
  }

  protected selectPassenger(index: number): void {
    this.activePassengerIndex = index;
  }

  protected seatZone(row: number): SeatZone {
    if (row <= 2) {
      return 'XL';
    }

    if (row <= 5) {
      return 'Preferred';
    }

    return 'Standard';
  }

  protected seatPrice(row: number): number {
    if (row <= 2) {
      return 1800;
    }

    if (row <= 5) {
      return 900;
    }

    return 450;
  }

  protected isReserved(seatNumber: string): boolean {
    const flight = this.primaryFlight();
    return flight ? this.store.getReservedSeatsForFlight(flight.id).includes(seatNumber) : false;
  }

  protected seatSelectionForPassenger(passengerIndex: number): SeatSelection | undefined {
    return this.selectedSeats().find((seat) => seat.passengerIndex === passengerIndex);
  }

  protected isSelected(seatNumber: string): boolean {
    return this.selectedSeats().some((seat) => seat.seatNumber === seatNumber);
  }

  protected chooseSeat(row: number, letter: string): void {
    const seatNumber = `${row}${letter}`;
    if (this.isReserved(seatNumber)) {
      return;
    }

    const passenger = this.passengers()[this.activePassengerIndex];
    if (!passenger) {
      return;
    }

    this.store.setSeatSelection({
      passengerIndex: this.activePassengerIndex,
      passengerName: `${passenger.firstName} ${passenger.lastName}`,
      seatNumber,
      zone: this.seatZone(row),
      price: this.seatPrice(row)
    });

    if (this.activePassengerIndex < this.passengers().length - 1) {
      this.activePassengerIndex += 1;
    }
  }

  protected continue(): void {
    if (this.selectedSeats().length === this.passengers().length) {
      void this.router.navigate(['/addons']);
    }
  }
}
