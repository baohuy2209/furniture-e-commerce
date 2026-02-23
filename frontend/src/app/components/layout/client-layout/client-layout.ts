import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { FloatingActions } from '../floating-actions/floating-actions';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-client-layout',
  imports: [Header, Footer, RouterOutlet, FloatingActions],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export class ClientLayout {
  variant: 'light' | 'dark' = 'light';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/events')) {
          this.variant = 'dark';
        } else {
          this.variant = 'light';
        }
      });
  }
}
