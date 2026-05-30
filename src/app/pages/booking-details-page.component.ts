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
}
