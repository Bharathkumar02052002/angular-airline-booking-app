import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { BookingStore } from '../core/booking.store';

@Component({
  selector: 'app-booking-details-page',
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './booking-details-page.component.html',
  styleUrl: './booking-details-page.component.scss'
})
export class BookingDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(BookingStore);

  private readonly pnr = toSignal(this.route.paramMap.pipe(map((params) => params.get('pnr') ?? '')), {
    initialValue: ''
  });

  protected readonly booking = computed(() => this.store.getBookingByPnr(this.pnr()));
  protected readonly recentBookings = this.store.getRecentBookings(3);
  protected readonly readiness = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return null;
    }

    const checks = [
      {
        label: 'Traveller contact saved',
        done: Boolean(booking.contact.email && booking.contact.phone)
      },
      {
        label: 'Seats selected',
        done: booking.seats.length === booking.passengers.length
      },
      {
        label: 'Payment completed',
        done: booking.paymentStatus === 'Success'
      },
      {
        label: 'Trip protection added',
        done: booking.addons.flexiChange || booking.addons.insuranceCover
      }
    ];

    const score = Math.round((checks.filter((item) => item.done).length / checks.length) * 100);

    return { score, checks };
  });
  protected readonly tripWindow = computed(() => {
    const booking = this.booking();
    const firstFlight = booking?.itinerary[0];

    if (!firstFlight) {
      return null;
    }

    const departure = new Date(`${firstFlight.date}T${firstFlight.departureTime}:00`);
    const diffHours = Math.round((departure.getTime() - Date.now()) / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return 'Departure time has passed for the first segment.';
    }

    if (diffHours <= 24) {
      return 'Check-in window should be open for the first segment.';
    }

    if (diffHours <= 72) {
      return 'Trip is coming up soon. Good time to re-check seats and baggage.';
    }

    return 'Trip is scheduled further out. You can still review seats, meals, and baggage.';
  });
}
