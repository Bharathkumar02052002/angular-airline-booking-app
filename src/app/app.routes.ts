import { Routes } from '@angular/router';
import { AddonsPageComponent } from './pages/addons-page.component';
import { BookingDetailsPageComponent } from './pages/booking-details-page.component';
import { ConfirmationPageComponent } from './pages/confirmation-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { PassengerDetailsPageComponent } from './pages/passenger-details-page.component';
import { PaymentPageComponent } from './pages/payment-page.component';
import { PnrLookupPageComponent } from './pages/pnr-lookup-page.component';
import { SearchResultsPageComponent } from './pages/search-results-page.component';
import { SeatSelectionPageComponent } from './pages/seat-selection-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'search', component: SearchResultsPageComponent },
  { path: 'travellers', component: PassengerDetailsPageComponent },
  { path: 'seats', component: SeatSelectionPageComponent },
  { path: 'addons', component: AddonsPageComponent },
  { path: 'payment', component: PaymentPageComponent },
  { path: 'confirmation/:pnr', component: ConfirmationPageComponent },
  { path: 'pnr-lookup', component: PnrLookupPageComponent },
  { path: 'my-trips/:pnr', component: BookingDetailsPageComponent },
  { path: '**', redirectTo: '' }
];
