import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isLoggedIn = false;
  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';

  private authSubscription!: Subscription;
  private cartUpdateListener: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cart
    this.updateCartCount();
    this.cartUpdateListener = () => this.updateCartCount();
    window.addEventListener('cartUpdated', this.cartUpdateListener);

    // Auth
    this.authSubscription = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  ngOnDestroy(): void {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {}

  updateCartCount(): void {
    const savedCart = localStorage.getItem('homebase_cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      this.cartCount = items.reduce(
        (total: number, item: any) => total + item.quantity,
        0
      );
    } else {
      this.cartCount = 0;
    }
  }

  getCurrentUrl(): string {
    const segments = this.router.url.split('/');
    return segments[1] === '' ? 'home' : segments[1];
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;

    if (this.isSearchOpen) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 400);
    } else {
      this.searchQuery = '';
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      this.isSearchOpen = false;
    }
  }

  goSignIn(): void {
    this.router.navigate(['/auth/sign-in']);
  }

  goSignUp(): void {
    this.router.navigate(['/auth/sign-up']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}