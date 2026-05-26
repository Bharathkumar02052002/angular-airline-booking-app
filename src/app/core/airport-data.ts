export type AirportOption = {
  code: string;
  city: string;
  airport: string;
  country: string;
  spotlight: string;
};

export const AIRPORTS: AirportOption[] = [
  {
    code: 'DEL',
    city: 'Delhi',
    airport: 'Indira Gandhi International Airport',
    country: 'India',
    spotlight: 'Hub for business and international departures'
  },
  {
    code: 'BOM',
    city: 'Mumbai',
    airport: 'Chhatrapati Shivaji Maharaj International Airport',
    country: 'India',
    spotlight: 'Most-booked metro route in the demo'
  },
  {
    code: 'BLR',
    city: 'Bengaluru',
    airport: 'Kempegowda International Airport',
    country: 'India',
    spotlight: 'Perfect for technology and startup travel'
  },
  {
    code: 'HYD',
    city: 'Hyderabad',
    airport: 'Rajiv Gandhi International Airport',
    country: 'India',
    spotlight: 'Popular for domestic corporate trips'
  },
  {
    code: 'MAA',
    city: 'Chennai',
    airport: 'Chennai International Airport',
    country: 'India',
    spotlight: 'Strong South India connections'
  },
  {
    code: 'GOI',
    city: 'Goa',
    airport: 'Manohar International Airport',
    country: 'India',
    spotlight: 'Weekend getaway favorite'
  },
  {
    code: 'CCU',
    city: 'Kolkata',
    airport: 'Netaji Subhas Chandra Bose International Airport',
    country: 'India',
    spotlight: 'High traffic for festive travel'
  },
  {
    code: 'COK',
    city: 'Kochi',
    airport: 'Cochin International Airport',
    country: 'India',
    spotlight: 'Leisure plus Gulf connection point'
  },
  {
    code: 'DXB',
    city: 'Dubai',
    airport: 'Dubai International Airport',
    country: 'UAE',
    spotlight: 'International showcase route'
  },
  {
    code: 'SIN',
    city: 'Singapore',
    airport: 'Singapore Changi Airport',
    country: 'Singapore',
    spotlight: 'Premium long-haul style demo route'
  }
];

export const FEATURED_DEALS = [
  {
    route: 'Delhi to Mumbai',
    fare: 'INR 4,950',
    badge: 'Top searched',
    details: 'Fast evening departures with 2 cabin choices'
  },
  {
    route: 'Bengaluru to Goa',
    fare: 'INR 3,780',
    badge: 'Weekend pick',
    details: 'Late Friday and Sunday return timing'
  },
  {
    route: 'Mumbai to Dubai',
    fare: 'INR 12,450',
    badge: 'International',
    details: 'Meal and extra baggage combos supported'
  }
];

export const EXPERIENCE_HIGHLIGHTS = [
  'One-way, round-trip, and multi-city planning',
  'Seat map with zone-based pricing',
  'Add-ons for meals, baggage, lounge, and flexibility',
  'Payment simulation with PNR confirmation'
];
