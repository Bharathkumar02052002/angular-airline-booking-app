import { AIRPORTS } from './airport-data';
import { FlightOption } from './booking.models';

type RouteTemplate = {
  origin: string;
  destination: string;
  duration: string;
  baseFare: number;
  times: Array<{ departure: string; arrival: string }>;
  aircraft: string;
  tags: string[];
};

const ROUTES: RouteTemplate[] = [
  {
    origin: 'DEL',
    destination: 'BOM',
    duration: '2h 10m',
    baseFare: 4650,
    aircraft: 'Airbus A320neo',
    tags: ['Non-stop', 'Business favourite'],
    times: [
      { departure: '06:20', arrival: '08:30' },
      { departure: '11:10', arrival: '13:20' },
      { departure: '18:40', arrival: '20:50' }
    ]
  },
  {
    origin: 'BOM',
    destination: 'GOI',
    duration: '1h 15m',
    baseFare: 3450,
    aircraft: 'Airbus A321',
    tags: ['Beach break', 'Cabin bags only fare'],
    times: [
      { departure: '07:25', arrival: '08:40' },
      { departure: '14:10', arrival: '15:25' },
      { departure: '20:05', arrival: '21:20' }
    ]
  },
  {
    origin: 'BLR',
    destination: 'DEL',
    duration: '2h 45m',
    baseFare: 5120,
    aircraft: 'Airbus A320neo',
    tags: ['Fast Wi-Fi mock', 'Most booked'],
    times: [
      { departure: '05:50', arrival: '08:35' },
      { departure: '12:30', arrival: '15:15' },
      { departure: '19:05', arrival: '21:50' }
    ]
  },
  {
    origin: 'HYD',
    destination: 'BOM',
    duration: '1h 35m',
    baseFare: 3980,
    aircraft: 'Airbus A320neo',
    tags: ['Morning shuttle', 'Corporate saver'],
    times: [
      { departure: '06:55', arrival: '08:30' },
      { departure: '13:40', arrival: '15:15' },
      { departure: '21:00', arrival: '22:35' }
    ]
  },
  {
    origin: 'MAA',
    destination: 'BLR',
    duration: '1h 05m',
    baseFare: 2860,
    aircraft: 'ATR 72',
    tags: ['Quick connect', 'Short hop'],
    times: [
      { departure: '08:10', arrival: '09:15' },
      { departure: '15:00', arrival: '16:05' },
      { departure: '19:40', arrival: '20:45' }
    ]
  },
  {
    origin: 'CCU',
    destination: 'DEL',
    duration: '2h 25m',
    baseFare: 4890,
    aircraft: 'Airbus A321',
    tags: ['Evening red-eye style', 'Hot meal upgrade'],
    times: [
      { departure: '06:10', arrival: '08:35' },
      { departure: '11:45', arrival: '14:10' },
      { departure: '20:55', arrival: '23:20' }
    ]
  },
  {
    origin: 'BOM',
    destination: 'DXB',
    duration: '3h 10m',
    baseFare: 11990,
    aircraft: 'Airbus A321XLR',
    tags: ['International', 'Meal included in Flex'],
    times: [
      { departure: '08:45', arrival: '10:25' },
      { departure: '15:40', arrival: '17:20' },
      { departure: '22:15', arrival: '23:55' }
    ]
  },
  {
    origin: 'DEL',
    destination: 'SIN',
    duration: '5h 35m',
    baseFare: 18450,
    aircraft: 'Boeing 787-9',
    tags: ['Long haul demo', 'Premium economy'],
    times: [
      { departure: '09:30', arrival: '17:35' },
      { departure: '23:10', arrival: '07:15' },
      { departure: '01:40', arrival: '09:45' }
    ]
  },
  {
    origin: 'COK',
    destination: 'DXB',
    duration: '4h 15m',
    baseFare: 13480,
    aircraft: 'Airbus A320neo',
    tags: ['NRI traffic', 'Extra baggage popular'],
    times: [
      { departure: '07:10', arrival: '09:55' },
      { departure: '12:35', arrival: '15:20' },
      { departure: '21:35', arrival: '00:20' }
    ]
  },
  {
    origin: 'BLR',
    destination: 'GOI',
    duration: '1h 20m',
    baseFare: 3610,
    aircraft: 'Airbus A320neo',
    tags: ['Leisure', 'Late checkout friendly'],
    times: [
      { departure: '09:20', arrival: '10:40' },
      { departure: '16:05', arrival: '17:25' },
      { departure: '21:15', arrival: '22:35' }
    ]
  }
];

function getDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function airportLabel(code: string): string {
  return AIRPORTS.find((airport) => airport.code === code)?.city ?? code;
}

function reverseRoute(route: RouteTemplate): RouteTemplate {
  return {
    ...route,
    origin: route.destination,
    destination: route.origin,
    tags: [...route.tags]
  };
}

function buildFlightId(route: RouteTemplate, date: string, slotIndex: number): string {
  return `${route.origin}-${route.destination}-${date}-${slotIndex}`;
}

export const MOCK_FLIGHTS: FlightOption[] = [...ROUTES, ...ROUTES.map(reverseRoute)].flatMap(
  (route, routeIndex) =>
    Array.from({ length: 40 }, (_, dayOffset) => {
      const date = getDateOffset(dayOffset + 1);

      return route.times.map((slot, slotIndex) => {
        const tax = Math.round(route.baseFare * 0.18);
        const fareOffset = (dayOffset % 5) * 240 + slotIndex * 310 + routeIndex * 70;
        const totalBaseFare = route.baseFare + fareOffset;
        const fareFamilies = ['Saver', 'Flex', 'Smart Plus'] as const;

        return {
          id: buildFlightId(route, date, slotIndex),
          airline: 'SkyBound Air',
          flightNumber: `SB ${routeIndex + 2}${slotIndex + 1}${route.origin.charCodeAt(0) % 9}`,
          origin: route.origin,
          destination: route.destination,
          originLabel: airportLabel(route.origin),
          destinationLabel: airportLabel(route.destination),
          date,
          departureTime: slot.departure,
          arrivalTime: slot.arrival,
          duration: route.duration,
          aircraft: route.aircraft,
          terminal: route.destination === 'DXB' || route.destination === 'SIN' ? 'T3' : 'T1',
          fareFamily: fareFamilies[slotIndex],
          baseFare: totalBaseFare,
          taxes: tax,
          seatsLeft: Math.max(3, 18 - ((dayOffset + slotIndex + routeIndex) % 14)),
          tags: route.tags
        } satisfies FlightOption;
      });
    }).flat()
);
