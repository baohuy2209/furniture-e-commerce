import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../../interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  currentToken: string | null = null;
  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';
  userName: string = '';
  currentUserInfo: IUser | null = null;
  error = '';
  success = '';

  private authSubscription!: Subscription;
  private cartUpdateListener: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Cart
    this.updateCartCount();
    this.cartUpdateListener = () => this.updateCartCount();
    window.addEventListener('cartUpdated', this.cartUpdateListener);

    this.currentToken = this.authService.getAccessToken();
    if (this.currentToken) {
      this.userService.getUserInfo().subscribe({
        next: (res) => {
          if (!res.data) {
            this.error = 'Không tìm thấy thông tin người dùng';
            this.cdr.detectChanges();
          }
          this.currentUserInfo = res.data;
          let lengthName = this.currentUserInfo.name.split(' ').length;
          this.userName = this.currentUserInfo.name.split(' ')[lengthName - 1];
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thấy thông tin người dùng ';
            console.log(this.error);
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.cdr.detectChanges();
        },
      });
    }
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
      this.cartCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
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
    window.location.reload();
  }
}
