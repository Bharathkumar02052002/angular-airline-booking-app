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
  protected readonly segmentInsights = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return [];
    }

    return booking.itinerary.map((flight) => ({
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      title: `${flight.origin} - ${flight.destination}`,
      onTimeRate: flight.onTimeRate,
      carbonKg: flight.carbonKg,
      recommendedGateWindow: flight.terminal === 'T3' ? 'Reach gate 45 min before departure' : 'Reach gate 35 min before departure',
      amenityNote: flight.amenities.join(' | ')
    }));
  });
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
  protected readonly refundEstimate = computed(() => {
    const booking = this.booking();
    const firstFlight = booking?.itinerary[0];

    if (!booking || !firstFlight) {
      return null;
    }

    const departure = new Date(`${firstFlight.date}T${firstFlight.departureTime}:00`);
    const hoursToDeparture = Math.round((departure.getTime() - Date.now()) / (1000 * 60 * 60));
    const refundableBase = booking.baseFareTotal + booking.taxTotal;

    let refundRate = 0.75;
    let fee = 1800;
    let note = 'Cancellation is still relatively flexible.';

    if (hoursToDeparture <= 72) {
      refundRate = 0.55;
      fee = 2500;
      note = 'Closer to departure, so the estimated refund is lower.';
    }

    if (hoursToDeparture <= 24) {
      refundRate = 0.3;
      fee = 3200;
      note = 'Last-day cancellation window. Most of the fare is retained.';
    }

    if (booking.paymentStatus !== 'Success') {
      refundRate = 0;
      fee = 0;
      note = 'No completed payment was captured for this booking.';
    }

    const refundAmount = Math.max(0, Math.round(refundableBase * refundRate - fee));

    return {
      hoursToDeparture,
      refundAmount,
      fee,
      note
    };
  });
  protected readonly fareRules = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return [];
    }

    return [
      {
        label: 'Date change rule',
        detail: booking.addons.flexiChange ? 'Flexi change add-on is active for this booking.' : 'Standard fare difference and airline fee would apply.'
      },
      {
        label: 'Refund handling',
        detail: booking.paymentStatus === 'Success' ? 'Refunds go back to the original payment source in this demo.' : 'No completed charge captured yet.'
      },
      {
        label: 'Meal and baggage rule',
        detail:
          booking.addons.mealBundle === 'None' && booking.addons.baggageOption === 'None'
            ? 'No optional meal or baggage service attached.'
            : 'Add-on services are tied to this PNR and visible at check-in.'
      }
    ];
  });
  protected readonly travellerServices = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return null;
    }

    return {
      purpose: booking.contact.travelPurpose || 'Leisure',
      assistanceRequired: Boolean(booking.contact.assistanceRequired),
      assistanceNotes: booking.contact.assistanceNotes || 'No assistance notes added.'
    };
  });
  protected readonly documentSummary = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return [];
    }

    return booking.passengers.map((passenger) => ({
      name: `${passenger.firstName} ${passenger.lastName}`,
      documentType: passenger.documentType || 'Document not added',
      documentNumber: this.maskDocument(passenger.documentNumber || 'Not provided')
    }));
  });
  protected readonly airportTimeline = computed(() => {
    const booking = this.booking();
    const firstFlight = booking?.itinerary[0];

    if (!firstFlight) {
      return [];
    }

    const international = firstFlight.destination === 'DXB' || firstFlight.destination === 'SIN';
    return [
      { label: 'Web check-in', note: international ? 'Open 48h before departure' : 'Open 24h before departure' },
      { label: 'Airport arrival', note: international ? 'Reach airport 3h before departure' : 'Reach airport 2h before departure' },
      { label: 'Bag drop', note: international ? 'Complete 75 min before departure' : 'Complete 60 min before departure' },
      { label: 'Boarding gate', note: firstFlight.terminal === 'T3' ? 'Be at gate 45 min before departure' : 'Be at gate 35 min before departure' }
    ];
  });

  private maskDocument(documentNumber: string): string {
    if (documentNumber.length <= 4) {
      return documentNumber;
    }

    return `${'*'.repeat(documentNumber.length - 4)}${documentNumber.slice(-4)}`;
  }
}
