import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  protected readonly navItems = [
    { label: 'Book', href: '/' },
    { label: 'Search Flights', href: '/search' },
    { label: 'Manage Booking', href: '/pnr-lookup' }
  ];
}
