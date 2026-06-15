import {
  AddonSelection,
  AirlineBooking,
  ContactDetails,
  FlightSearch,
  PassengerDetails
} from './booking.models';
import { MOCK_FLIGHTS } from './mock-flights';

const sampleSearch: FlightSearch = {
  tripType: 'round-trip',
  cabin: 'Economy',
  passengers: {
    adults: 1,
    children: 1,
    infants: 0
  },
  promoCode: 'SKYFAM',
  legs: [
    { origin: 'DEL', destination: 'BOM', date: MOCK_FLIGHTS[0]?.date ?? '2026-06-01' },
    { origin: 'BOM', destination: 'DEL', date: MOCK_FLIGHTS[90]?.date ?? '2026-06-05' }
  ]
};

const samplePassengers: PassengerDetails[] = [
  {
    passengerType: 'Adult',
    title: 'Ms',
    firstName: 'Meera',
    lastName: 'Raman',
    gender: 'Female',
    dateOfBirth: '1992-02-18',
    mealPreference: 'No meal',
    frequentFlyerId: 'SB224801',
    documentType: 'Aadhaar',
    documentNumber: 'AADA-6621'
  },
  {
    passengerType: 'Child',
    title: 'Master',
    firstName: 'Arjun',
    lastName: 'Raman',
    gender: 'Male',
    dateOfBirth: '2017-09-12',
    mealPreference: 'No meal',
    frequentFlyerId: '',
    documentType: 'School ID',
    documentNumber: 'SCH-2048'
  }
];

const sampleContact: ContactDetails = {
  email: 'meera.raman@example.com',
  phone: '9876543210',
  city: 'Chennai',
  receiveAlerts: true,
  travelPurpose: 'Family Visit',
  assistanceRequired: false,
  assistanceNotes: ''
};

const sampleAddons: AddonSelection = {
  baggageOption: '20kg',
  mealBundle: 'Comfort Meal',
  loungeAccess: false,
  priorityServices: true,
  flexiChange: true,
  insuranceCover: true
};

export const MOCK_BOOKINGS: AirlineBooking[] = [
  {
    id: 'SB-BOOK-1001',
    pnr: 'SB6Q2P',
    bookedAt: new Date().toISOString(),
    primaryLastName: 'RAMAN',
    status: 'Confirmed',
    paymentMode: 'UPI',
    paymentStatus: 'Success',
    search: sampleSearch,
    itinerary: [MOCK_FLIGHTS[0], MOCK_FLIGHTS[90]].filter(
      (flight): flight is (typeof MOCK_FLIGHTS)[number] => Boolean(flight)
    ),
    passengers: samplePassengers,
    contact: sampleContact,
    seats: [
      {
        passengerIndex: 0,
        passengerName: 'Meera Raman',
        seatNumber: '3A',
        zone: 'Preferred',
        price: 900
      },
      {
        passengerIndex: 1,
        passengerName: 'Arjun Raman',
        seatNumber: '3B',
        zone: 'Preferred',
        price: 900
      }
    ],
    addons: sampleAddons,
    baseFareTotal: 11620,
    taxTotal: 2090,
    addonsTotal: 2499,
    seatsTotal: 1800,
    grandTotal: 18009
  }
];
