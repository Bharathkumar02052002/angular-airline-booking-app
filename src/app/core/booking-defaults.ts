import { AddonSelection, BookingDraft, FlightSearch } from './booking.models';

export function createDefaultSearch(defaultDate: string): FlightSearch {
  return {
    tripType: 'one-way',
    cabin: 'Economy',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    promoCode: '',
    legs: [{ origin: 'DEL', destination: 'BOM', date: defaultDate }]
  };
}

export function createDefaultAddons(): AddonSelection {
  return {
    baggageOption: 'None',
    mealBundle: 'None',
    loungeAccess: false,
    priorityServices: false,
    flexiChange: false,
    insuranceCover: false
  };
}

export function createEmptyDraft(defaultDate: string): BookingDraft {
  return {
    search: createDefaultSearch(defaultDate),
    selectedFlights: [],
    passengers: [],
    contact: null,
    seats: [],
    addons: createDefaultAddons(),
    paymentMode: null,
    paymentStatus: null
  };
}
