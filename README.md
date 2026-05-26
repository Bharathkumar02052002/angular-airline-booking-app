# SkyBound Air

A realistic airline booking and PNR demo app built in Angular for portfolio and recruiter walkthroughs.

## What it demonstrates

- one-way, round-trip, and multi-city search flows
- fare selection with realistic mock flight inventory
- traveller details with reactive form validation
- seat selection with zone-based pricing
- add-ons such as baggage, meals, lounge, flexi change, and insurance
- fake payment flow with success, pending, and failed outcomes
- booking confirmation with generated PNR
- manage-booking flow with PNR and last-name lookup
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

## Suggested publish flow

1. Push this folder to a new GitHub repo named `angular-airline-booking-pnr-app`.
2. Deploy the built `dist/angular-airline-booking-pnr-app` output to Firebase Hosting, Netlify, or Vercel.
3. Add screenshots of the homepage, flight selection, seat map, payment page, and PNR lookup to the repo README.
