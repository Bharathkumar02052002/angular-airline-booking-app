import { computed, Injectable, signal } from '@angular/core';
import { AIRPORTS } from './airport-data';
import { createDefaultAddons, createEmptyDraft } from './booking-defaults';
import {
  AddonSelection,
  AirlineBooking,
  BookingDraft,
  BookingStatus,
  ContactDetails,
  FlightOption,
  FlightSearch,
  PassengerDetails,
  PaymentMode,
  PaymentStatus,
  SeatSelection
} from './booking.models';
import { MOCK_FLIGHTS } from './mock-flights';
import { MOCK_BOOKINGS } from './mock-bookings';
import { buildPriceSummary } from './booking-pricing';

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly draftStorageKey = 'skybound-air-draft-v1';
  private readonly bookingStorageKey = 'skybound-air-bookings-v1';
  private readonly recentSearchesStorageKey = 'skybound-air-recent-searches-v1';

  readonly airports = AIRPORTS;
  readonly flights = MOCK_FLIGHTS;

  private readonly bookingState = signal<AirlineBooking[]>(this.loadBookings());
  private readonly draftState = signal<BookingDraft>(this.loadDraft());
  private readonly recentSearchState = signal<FlightSearch[]>(this.loadRecentSearches());

  readonly bookings = this.bookingState.asReadonly();
  readonly draft = this.draftState.asReadonly();
  readonly recentSearches = this.recentSearchState.asReadonly();
  readonly activeSearch = computed(() => this.draftState().search);
  readonly selectedFlights = computed(() => this.draftState().selectedFlights);
  readonly selectedPassengers = computed(() => this.draftState().passengers);
  readonly itineraryComplete = computed(
    () => this.draftState().selectedFlights.length === this.draftState().search.legs.length
  );
  readonly priceSummary = computed(() => buildPriceSummary(this.draftState()));

  setSearch(search: FlightSearch): void {
    this.draftState.set({
      search,
      selectedFlights: [],
      passengers: [],
      contact: null,
      seats: [],
      addons: createDefaultAddons(),
      paymentMode: null,
      paymentStatus: null
    });
    this.saveRecentSearch(search);
    this.persistDraft();
  }

  updateLegDate(index: number, date: string): void {
    const current = this.draftState();
    const legs = current.search.legs.map((leg, legIndex) =>
      legIndex === index ? { ...leg, date } : leg
    );
    const keptSelections = current.selectedFlights.slice(0, index);

    this.draftState.set({
      ...current,
      search: {
        ...current.search,
        legs
      },
      selectedFlights: keptSelections,
      seats: [],
      paymentMode: null,
      paymentStatus: null
    });
    this.persistDraft();
  }

  getFlightsForLeg(origin: string, destination: string, date: string): FlightOption[] {
    return this.flights
      .filter((flight) => flight.origin === origin && flight.destination === destination && flight.date === date)
      .sort((left, right) => left.baseFare - right.baseFare);
  }

  selectFlight(flight: FlightOption): void {
    const current = this.draftState();
    this.draftState.set({
      ...current,
      selectedFlights: [...current.selectedFlights, flight],
      seats: [],
      paymentMode: null,
      paymentStatus: null
    });
    this.persistDraft();
  }

  replaceFlightAt(index: number, flight: FlightOption): void {
    const current = this.draftState();
    const selectedFlights = [...current.selectedFlights];
    selectedFlights[index] = flight;

    this.draftState.set({
      ...current,
      selectedFlights,
      seats: [],
      paymentMode: null,
      paymentStatus: null
    });
    this.persistDraft();
  }

  trimSelections(index: number): void {
    const current = this.draftState();
    this.draftState.set({
      ...current,
      selectedFlights: current.selectedFlights.slice(0, index),
      seats: [],
      paymentMode: null,
      paymentStatus: null
    });
    this.persistDraft();
  }

  savePassengerDetails(passengers: PassengerDetails[], contact: ContactDetails): void {
    this.draftState.set({
      ...this.draftState(),
      passengers,
      contact
    });
    this.persistDraft();
  }

  setSeatSelection(selection: SeatSelection): void {
    const current = this.draftState();
    const nextSeats = [...current.seats];
    const existingIndex = nextSeats.findIndex((seat) => seat.passengerIndex === selection.passengerIndex);

    if (existingIndex >= 0) {
      nextSeats[existingIndex] = selection;
    } else {
      nextSeats.push(selection);
    }

    this.draftState.set({
      ...current,
      seats: nextSeats.sort((left, right) => left.passengerIndex - right.passengerIndex)
    });
    this.persistDraft();
  }

  saveAddons(addons: AddonSelection): void {
    this.draftState.set({
      ...this.draftState(),
      addons
    });
    this.persistDraft();
  }

  setPayment(mode: PaymentMode, status: PaymentStatus): void {
    this.draftState.set({
      ...this.draftState(),
      paymentMode: mode,
      paymentStatus: status
    });
    this.persistDraft();
  }

  completeBooking(): AirlineBooking | null {
    const draft = this.draftState();
    if (!draft.contact || !draft.paymentMode || !draft.paymentStatus || !draft.passengers.length) {
      return null;
    }

    const summary = buildPriceSummary(draft);
    const booking: AirlineBooking = {
      id: `SB-BOOK-${1000 + this.bookingState().length + 1}`,
      pnr: this.generatePnr(),
      bookedAt: new Date().toISOString(),
      primaryLastName: draft.passengers[0]?.lastName.toUpperCase() ?? 'GUEST',
      status: this.mapPaymentStatus(draft.paymentStatus),
      paymentMode: draft.paymentMode,
      paymentStatus: draft.paymentStatus,
      search: draft.search,
      itinerary: draft.selectedFlights,
      passengers: draft.passengers,
      contact: draft.contact,
      seats: draft.seats,
      addons: draft.addons,
      baseFareTotal: summary.baseFare,
      taxTotal: summary.taxes,
      addonsTotal: summary.addons,
      seatsTotal: summary.seats,
      grandTotal: summary.total
    };

    this.bookingState.update((items) => [booking, ...items]);
    this.persistBookings();

    this.draftState.set({
      ...createEmptyDraft(this.defaultDate())
    });
    this.persistDraft();

    return booking;
  }

  getBookingByPnr(pnr: string): AirlineBooking | undefined {
    return this.bookingState().find((booking) => booking.pnr.toUpperCase() === pnr.toUpperCase());
  }

  getRecentBookings(limit = 5): AirlineBooking[] {
    return [...this.bookingState()]
      .sort((left, right) => right.bookedAt.localeCompare(left.bookedAt))
      .slice(0, limit);
  }

  findBookingByPnrAndLastName(pnr: string, lastName: string): AirlineBooking | undefined {
    return this.bookingState().find(
      (booking) =>
        booking.pnr.toUpperCase() === pnr.toUpperCase() &&
        booking.primaryLastName === lastName.trim().toUpperCase()
    );
  }

  getReservedSeatsForFlight(flightId: string): string[] {
    return this.bookingState()
      .filter((booking) => booking.itinerary.some((flight) => flight.id === flightId))
      .flatMap((booking) => booking.seats.map((seat) => seat.seatNumber));
  }

  getAirportName(code: string): string {
    return this.airports.find((airport) => airport.code === code)?.city ?? code;
  }

  private mapPaymentStatus(paymentStatus: PaymentStatus): BookingStatus {
    switch (paymentStatus) {
      case 'Success':
        return 'Confirmed';
      case 'Pending':
        return 'Pending Payment';
      case 'Failed':
        return 'Payment Failed';
      default:
        return 'Pending Payment';
    }
  }

  private loadBookings(): AirlineBooking[] {
    const saved = this.readStorage<AirlineBooking[]>(this.bookingStorageKey);
    return saved?.length ? saved : MOCK_BOOKINGS;
  }

  private loadDraft(): BookingDraft {
    return this.readStorage<BookingDraft>(this.draftStorageKey) ?? createEmptyDraft(this.defaultDate());
  }

  private loadRecentSearches(): FlightSearch[] {
    return this.readStorage<FlightSearch[]>(this.recentSearchesStorageKey) ?? [];
  }

  private persistBookings(): void {
    this.writeStorage(this.bookingStorageKey, this.bookingState());
  }

  private persistDraft(): void {
    this.writeStorage(this.draftStorageKey, this.draftState());
  }

  private persistRecentSearches(): void {
    this.writeStorage(this.recentSearchesStorageKey, this.recentSearchState());
  }

  private readStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Best effort persistence for local demo state.
    }
  }

  private saveRecentSearch(search: FlightSearch): void {
    const searchKey = this.searchKey(search);
    const next = [
      search,
      ...this.recentSearchState().filter((item) => this.searchKey(item) !== searchKey)
    ].slice(0, 5);

    this.recentSearchState.set(next);
    this.persistRecentSearches();
  }

  private generatePnr(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private defaultDate(): string {
    return this.flights[0]?.date ?? new Date().toISOString().slice(0, 10);
  }

  private searchKey(search: FlightSearch): string {
    return JSON.stringify({
      tripType: search.tripType,
      cabin: search.cabin,
      passengers: search.passengers,
      legs: search.legs,
      promoCode: search.promoCode
    });
  }
}
