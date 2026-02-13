// import { CommonModule } from '@angular/common';
// import { AfterViewInit, Component, ElementRef, ViewChild, OnInit, OnDestroy, Input, } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router'; 
// import { Subscription } from 'rxjs';
// import { AuthService } from '../../../services/auth';

// @Component({
//   selector: 'app-header',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   templateUrl: './header.html',
//   styleUrl: './header.css',
// })
// export class Header implements OnInit, OnDestroy, AfterViewInit {
//   @Input() variant: 'light' | 'dark' = 'light';
//   @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
//   isLoggedIn: boolean = true;
//   private authSubscription!: Subscription;

//   cartCount = 0;
//   isSearchOpen = false;
//   searchQuery = '';
//   constructor(private router: Router, private authService: AuthService) {}
// ngOnInit(): void {
//     // Đăng ký lắng nghe sự thay đổi trạng thái đăng nhập từ AuthService
//     this.authSubscription = this.authService.isLoggedIn$.subscribe(status => {
//       this.isLoggedIn = status;
//     });
//   }

//    ngOnDestroy(): void {
//     // Hủy đăng ký khi component bị hủy để tránh memory leaks
//     if (this.authSubscription) {
//       this.authSubscription.unsubscribe();
//     }
//   }


//   ngAfterViewInit() {}
//   getCurrentUrl() {
//     const getCurrents = this.router.url.split('/');
//     return getCurrents[1] == '' ? 'home' : getCurrents[1];
//   }
//   toggleSearch(): void {
//     this.isSearchOpen = !this.isSearchOpen;

//     if (this.isSearchOpen) {
//       setTimeout(() => {
//         this.searchInput?.nativeElement.focus();
//       }, 400);
//     } else {
//       this.searchQuery = '';
//     }
//   }

//   onSearch(): void {
//     if (this.searchQuery.trim()) {
//       console.log('Searching for:', this.searchQuery);
//       // this.router.navigate(['/search'], {
//       //   queryParams: { q: this.searchQuery },
//       // });

//       this.isSearchOpen = false;
//     }
//   }

//   logout(): void {
//     console.log('Người dùng đã đăng xuất');
//     this.authService.logout(); // <== GỌI SERVICE ĐỂ THAY ĐỔI TRẠNG THÁI TOÀN CỤC
//     this.router.navigate(['/']); // Điều hướng về trang chủ
//   }
// }
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy, AfterViewInit {

  // vẫn giữ input nếu sau này muốn truyền tay
  @Input() variant: 'light' | 'dark' = 'light';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isLoggedIn: boolean = true;
  private authSubscription!: Subscription;
  private routerSubscription!: Subscription;

  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';

  constructor(private router: Router, private authService: AuthService) {}

  // =============================
  // INIT
  // =============================
  ngOnInit(): void {

    // Auth state
    this.authSubscription = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    // SET THEME LẦN ĐẦU
    this.setVariantByRoute(this.router.url);

    // LẮNG NGHE ROUTE THAY ĐỔI
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.setVariantByRoute(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {}

  // =============================
  // AUTO DARK WHEN /events
  // =============================
  private setVariantByRoute(url: string) {
    if (url.startsWith('/events')) {
      this.variant = 'dark';
    } else {
      this.variant = 'light';
    }
  }

  // =============================
  // HELPERS
  // =============================
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

  logout(): void {
    console.log('Người dùng đã đăng xuất');
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
