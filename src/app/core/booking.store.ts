import { computed, Injectable, signal } from '@angular/core';
import { AIRPORTS, EXPERIENCE_HIGHLIGHTS, FEATURED_DEALS } from './airport-data';
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

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly draftStorageKey = 'skybound-air-draft-v1';
  private readonly bookingStorageKey = 'skybound-air-bookings-v1';

  readonly airports = AIRPORTS;
  readonly featuredDeals = FEATURED_DEALS;
  readonly experienceHighlights = EXPERIENCE_HIGHLIGHTS;
  readonly flights = MOCK_FLIGHTS;

  private readonly bookingState = signal<AirlineBooking[]>(this.loadBookings());
  private readonly draftState = signal<BookingDraft>(this.loadDraft());

  readonly bookings = this.bookingState.asReadonly();
  readonly draft = this.draftState.asReadonly();
  readonly activeSearch = computed(() => this.draftState().search);
  readonly selectedFlights = computed(() => this.draftState().selectedFlights);
  readonly selectedPassengers = computed(() => this.draftState().passengers);
  readonly itineraryComplete = computed(
    () => this.draftState().selectedFlights.length === this.draftState().search.legs.length
  );
  readonly priceSummary = computed(() => this.buildPriceSummary(this.draftState()));
  readonly bookingMetrics = computed(() => [
    { label: 'Routes loaded', value: `${this.airports.length} airports` },
    { label: 'Workflow steps', value: `${this.draftState().search.legs.length + 5} pages` },
    { label: 'Saved PNRs', value: `${this.bookingState().length}` },
    { label: 'Flight records', value: `${this.flights.length}` }
  ]);

  setSearch(search: FlightSearch): void {
    this.draftState.set({
      search,
      selectedFlights: [],
      passengers: [],
      contact: null,
      seats: [],
      addons: this.defaultAddons(),
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

    const summary = this.buildPriceSummary(draft);
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
      search: this.createDefaultSearch(),
      selectedFlights: [],
      passengers: [],
      contact: null,
      seats: [],
      addons: this.defaultAddons(),
      paymentMode: null,
      paymentStatus: null
    });
    this.persistDraft();

    return booking;
  }

  getBookingByPnr(pnr: string): AirlineBooking | undefined {
    return this.bookingState().find((booking) => booking.pnr.toUpperCase() === pnr.toUpperCase());
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

  private buildPriceSummary(draft: BookingDraft): {
    baseFare: number;
    taxes: number;
    seats: number;
    addons: number;
    total: number;
  } {
    const baseFare = draft.selectedFlights.reduce((sum, flight) => sum + flight.baseFare, 0);
    const taxes = draft.selectedFlights.reduce((sum, flight) => sum + flight.taxes, 0);
    const seats = draft.seats.reduce((sum, seat) => sum + seat.price, 0);
    const passengerMultiplier =
      draft.search.passengers.adults + draft.search.passengers.children + draft.search.passengers.infants;
    const addons = this.calculateAddonTotal(draft.addons, passengerMultiplier);

    return {
      baseFare,
      taxes,
      seats,
      addons,
      total: baseFare + taxes + seats + addons
    };
  }

  private calculateAddonTotal(addons: AddonSelection, passengers: number): number {
    const baggageCharge =
      addons.baggageOption === '15kg'
        ? 1350
        : addons.baggageOption === '20kg'
          ? 1750
          : addons.baggageOption === '25kg'
            ? 2190
            : 0;
    const mealCharge =
      addons.mealBundle === 'Comfort Meal'
        ? 425
        : addons.mealBundle === 'Regional Meal'
          ? 480
          : addons.mealBundle === 'Fitness Meal'
            ? 520
            : 0;

    return (
      baggageCharge +
      mealCharge * passengers +
      (addons.loungeAccess ? 1199 : 0) +
      (addons.priorityServices ? 749 : 0) +
      (addons.flexiChange ? 1299 : 0) +
      (addons.insuranceCover ? 399 : 0)
    );
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
    return this.readStorage<BookingDraft>(this.draftStorageKey) ?? {
      search: this.createDefaultSearch(),
      selectedFlights: [],
      passengers: [],
      contact: null,
      seats: [],
      addons: this.defaultAddons(),
      paymentMode: null,
      paymentStatus: null
    };
  }

  private persistBookings(): void {
    this.writeStorage(this.bookingStorageKey, this.bookingState());
  }

  private persistDraft(): void {
    this.writeStorage(this.draftStorageKey, this.draftState());
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

  private createDefaultSearch(): FlightSearch {
    const departureDate = this.flights[0]?.date ?? new Date().toISOString().slice(0, 10);
    return {
      tripType: 'one-way',
      cabin: 'Economy',
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      },
      promoCode: '',
      legs: [{ origin: 'DEL', destination: 'BOM', date: departureDate }]
    };
  }

  private defaultAddons(): AddonSelection {
    return {
      baggageOption: 'None',
      mealBundle: 'None',
      loungeAccess: false,
      priorityServices: false,
      flexiChange: false,
      insuranceCover: false
    };
  }

  private generatePnr(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
