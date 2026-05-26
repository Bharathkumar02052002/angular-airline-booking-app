export type TripType = 'one-way' | 'round-trip' | 'multi-city';

export type CabinClass = 'Economy' | 'Premium Economy' | 'Business';

export type PassengerType = 'Adult' | 'Child' | 'Infant';

export type PassengerCounts = {
  adults: number;
  children: number;
  infants: number;
};

export type SearchLeg = {
  origin: string;
  destination: string;
  date: string;
};

export type FlightSearch = {
  tripType: TripType;
  cabin: CabinClass;
  passengers: PassengerCounts;
  legs: SearchLeg[];
  promoCode: string;
};

export type FlightOption = {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  terminal: string;
  fareFamily: 'Saver' | 'Flex' | 'Smart Plus';
  baseFare: number;
  taxes: number;
  seatsLeft: number;
  tags: string[];
};

export type PassengerDetails = {
  passengerType: PassengerType;
  title: 'Mr' | 'Ms' | 'Mrs' | 'Master';
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  mealPreference: 'No meal' | 'Veg combo' | 'Asian meal' | 'Protein box';
  frequentFlyerId: string;
};

export type ContactDetails = {
  email: string;
  phone: string;
  city: string;
  receiveAlerts: boolean;
};

export type SeatZone = 'Standard' | 'Preferred' | 'XL';

export type SeatSelection = {
  passengerIndex: number;
  passengerName: string;
  seatNumber: string;
  zone: SeatZone;
  price: number;
};

export type AddonSelection = {
  baggageOption: 'None' | '15kg' | '20kg' | '25kg';
  mealBundle: 'None' | 'Comfort Meal' | 'Regional Meal' | 'Fitness Meal';
  loungeAccess: boolean;
  priorityServices: boolean;
  flexiChange: boolean;
  insuranceCover: boolean;
};

export type PaymentMode = 'UPI' | 'Card' | 'Net Banking';

export type PaymentStatus = 'Success' | 'Pending' | 'Failed';

export type BookingStatus = 'Confirmed' | 'Pending Payment' | 'Payment Failed';

export type AirlineBooking = {
  id: string;
  pnr: string;
  bookedAt: string;
  primaryLastName: string;
  status: BookingStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  search: FlightSearch;
  itinerary: FlightOption[];
  passengers: PassengerDetails[];
  contact: ContactDetails;
  seats: SeatSelection[];
  addons: AddonSelection;
  baseFareTotal: number;
  taxTotal: number;
  addonsTotal: number;
  seatsTotal: number;
  grandTotal: number;
};

export type BookingDraft = {
  search: FlightSearch;
  selectedFlights: FlightOption[];
  passengers: PassengerDetails[];
  contact: ContactDetails | null;
  seats: SeatSelection[];
  addons: AddonSelection;
  paymentMode: PaymentMode | null;
  paymentStatus: PaymentStatus | null;
};
