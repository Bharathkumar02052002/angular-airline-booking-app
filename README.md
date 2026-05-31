# SkyBound Air

Angular airline booking demo with a complete booking flow and PNR lookup.

## Features

- one-way, round-trip, and multi-city search flows
- flight selection using local mock inventory
- recent-search history on the home page
- fare sorting and filtering on the search results page
- flexible-date fare board for nearby travel dates
- traveller details with reactive form validation
- seat selection with zone-based pricing
- add-ons such as baggage, meals, lounge, flexi change, and insurance
- fake payment flow with success, pending, and failed outcomes
- booking confirmation with generated PNR
- manage-booking flow with PNR and last-name lookup
- recent-booking shortcuts and contact/payment details in manage booking
- trip readiness score and pre-departure checklist in manage booking
- local persistence so created bookings can be retrieved after refresh

## Tech stack

- Angular 20
- TypeScript
- SCSS
- Angular Router
- Reactive Forms
- Signals for local booking state

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Build

```bash
npm run build
```

## Demo credentials

- Sample PNR: `SB6Q2P`
- Last name: `Raman`

## Notes

- The app currently uses browser storage, not Firebase, so bookings persist per browser.
- For deployment, publish `dist/angular-airline-booking-pnr-app` to Firebase Hosting, Netlify, or Vercel.
