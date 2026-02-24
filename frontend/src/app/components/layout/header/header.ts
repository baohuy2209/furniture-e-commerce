import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, OnInit, OnDestroy, } from '@angular/core';
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
  isLoggedIn: boolean = true;
  private authSubscription!: Subscription;

  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';
  constructor(private router: Router, private authService: AuthService) {}
ngOnInit(): void {
    // Đăng ký lắng nghe sự thay đổi trạng thái đăng nhập từ AuthService
    this.authSubscription = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

   ngOnDestroy(): void {
    // Hủy đăng ký khi component bị hủy để tránh memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }


  ngAfterViewInit() {}
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
      // this.router.navigate(['/search'], {
      //   queryParams: { q: this.searchQuery },
      // });

      this.isSearchOpen = false;
    }
  }

  logout(): void {
    console.log('Người dùng đã đăng xuất');
    this.authService.logout(); // <== GỌI SERVICE ĐỂ THAY ĐỔI TRẠNG THÁI TOÀN CỤC
    this.router.navigate(['/']); // Điều hướng về trang chủ
  }
}