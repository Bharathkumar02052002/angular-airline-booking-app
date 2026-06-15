import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { BookingStore } from '../core/booking.store';

@Component({
  selector: 'app-confirmation-page',
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './confirmation-page.component.html',
  styleUrl: './confirmation-page.component.scss'
})
export class ConfirmationPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(BookingStore);

  private readonly pnr = toSignal(this.route.paramMap.pipe(map((params) => params.get('pnr') ?? '')), {
    initialValue: ''
  });

  protected readonly booking = computed(() => this.store.getBookingByPnr(this.pnr()));
  protected readonly loyaltySummary = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return null;
    }

    const basePoints = Math.floor(booking.baseFareTotal / 12);
    const bonusPoints =
      (booking.paymentStatus === 'Success' ? 180 : 0) +
      (booking.addons.flexiChange ? 60 : 0) +
      (booking.addons.insuranceCover ? 40 : 0);

    return {
      points: basePoints + bonusPoints,
      tierNote:
        booking.search.cabin === 'Business'
          ? 'Business cabin earns a small bonus in this demo.'
          : 'Economy and Premium Economy keep the points estimate simple.'
    };
  });
  protected readonly nextSteps = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return [];
    }

    return [
      {
        label: 'Save your PNR',
        detail: `Keep ${booking.pnr} handy for lookup and manage-booking actions.`
      },
      {
        label: 'Review passengers',
        detail: `${booking.passengers.length} traveller${booking.passengers.length > 1 ? 's are' : ' is'} attached to this booking.`
      },
      {
        label: 'Check extras',
        detail: booking.addons.baggageOption === 'None' ? 'No extra baggage added yet.' : `Baggage add-on: ${booking.addons.baggageOption}.`
      }
    ];
  });
  protected readonly documentChecklist = computed(() => {
    const booking = this.booking();
    if (!booking) {
      return [];
    }

    const international = booking.itinerary.some(
      (flight) => flight.destination === 'DXB' || flight.destination === 'SIN'
    );

    return booking.passengers.map((passenger) => ({
      name: `${passenger.firstName} ${passenger.lastName}`,
      documentType: passenger.documentType || 'Document not added',
      note: international
        ? passenger.documentType === 'Passport'
          ? 'Passport recorded for international travel.'
          : 'International trips usually require a passport.'
        : `${passenger.documentType || 'ID document'} added for domestic ID reference.`
    }));
  });
}
