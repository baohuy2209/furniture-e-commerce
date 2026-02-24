import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';
  private cartUpdateListener: any;

  constructor(private router: Router) { }

  ngOnInit() {
    this.updateCartCount();

    // Listen for custom event from Cart component
    this.cartUpdateListener = () => this.updateCartCount();
    window.addEventListener('cartUpdated', this.cartUpdateListener);
  }

  ngOnDestroy() {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
  }

  updateCartCount() {
    const savedCart = localStorage.getItem('homebase_cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      this.cartCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
    } else {
      this.cartCount = 0;
    }
  }

  ngAfterViewInit() { }
  getCurrentUrl() {
    const getCurrents = this.router.url.split('/');
    return getCurrents[1] == '' ? 'home' : getCurrents[1];
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
  goSignIn() {
    this.router.navigate(['/auth/sign-in']);
  }
  goSignUp() {
    this.router.navigate(['/auth/sign-up']);
  }
}
