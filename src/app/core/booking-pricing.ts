import { AddonSelection, BookingDraft } from './booking.models';

export type PriceSummary = {
  baseFare: number;
  taxes: number;
  seats: number;
  addons: number;
  total: number;
};

export function buildPriceSummary(draft: BookingDraft): PriceSummary {
  const baseFare = draft.selectedFlights.reduce((sum, flight) => sum + flight.baseFare, 0);
  const taxes = draft.selectedFlights.reduce((sum, flight) => sum + flight.taxes, 0);
  const seats = draft.seats.reduce((sum, seat) => sum + seat.price, 0);
  const passengerCount =
    draft.search.passengers.adults + draft.search.passengers.children + draft.search.passengers.infants;
  const addons = calculateAddonTotal(draft.addons, passengerCount);

  return {
    baseFare,
    taxes,
    seats,
    addons,
    total: baseFare + taxes + seats + addons
  };
}

function calculateAddonTotal(addons: AddonSelection, passengerCount: number): number {
  const baggageCharge = addonBaggagePrice(addons.baggageOption);
  const mealCharge = addonMealPrice(addons.mealBundle);

  return (
    baggageCharge +
    mealCharge * passengerCount +
    (addons.loungeAccess ? 1199 : 0) +
    (addons.priorityServices ? 749 : 0) +
    (addons.flexiChange ? 1299 : 0) +
    (addons.insuranceCover ? 399 : 0)
  );
}

function addonBaggagePrice(option: AddonSelection['baggageOption']): number {
  switch (option) {
    case '15kg':
      return 1350;
    case '20kg':
      return 1750;
    case '25kg':
      return 2190;
    default:
      return 0;
  }
}

function addonMealPrice(option: AddonSelection['mealBundle']): number {
  switch (option) {
    case 'Comfort Meal':
      return 425;
    case 'Regional Meal':
      return 480;
    case 'Fitness Meal':
      return 520;
    default:
      return 0;
  }
}
