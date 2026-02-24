import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HeaderProfile } from './header-profile/header-profile';
import { SettingsSidebar } from './settings-sidebar/settings-sidebar';

@Component({
  selector: 'app-setting-layout',
  standalone: true,
  imports: [RouterOutlet, SettingsSidebar, HeaderProfile, RouterLink, RouterLinkActive],
  templateUrl: './setting-layout.html',
  styleUrl: './setting-layout.css',
})
export class SettingLayout implements OnInit, OnDestroy {
  showHeaderProfile = signal(true);
  showUserInSidebar = signal(true);

  private routerSubscription!: Subscription;

  list_menu = [
    { id: 1, name: 'Thông tin cá nhân', href: '/settings/profile', iconClass: 'fa-solid fa-user' },
    {
      id: 2,
      name: 'Đổi mật khẩu',
      href: '/settings/change-password',
      iconClass: 'fa-solid fa-pen',
    },
    {
      id: 3,
      name: 'Đơn hàng của tôi',
      href: '/settings/my-orders',
      iconClass: 'fa-solid fa-receipt',
    },
    {
      id: 4,
      name: 'Đánh giá sản phẩm',
      href: '/settings/my-reviews',
      iconClass: 'fa-solid fa-comment-dollar',
    },
    {
      id: 5,
      name: 'Phương thức thanh toán',
      href: '/settings/my-payment-method',
      iconClass: 'fa-solid fa-money-bills',
    },
    {
      id: 6,
      name: 'Khuyến mãi',
      href: '/settings/my-promotions',
      iconClass: 'fa-solid fa-percent',
    },
    { id: 7, name: 'Chính sách', href: '/settings/policy', iconClass: 'fa-solid fa-handcuffs' },
    { id: 8, name: 'Cài đặt', href: '/settings/user-setting', iconClass: 'fa-solid fa-bars' },
    {
      id: 9,
      name: 'Bảo hành',
      href: '/settings/request-warranty',
      iconClass: 'fa-solid fa-user-shield',
    },
    {
      id: 10,
      name: 'Hỗ trợ',
      href: '/settings/support',
      iconClass: 'fa-solid fa-person-circle-question',
    },
  ];

  user = {
    username: 'baohuy2209',
    firstName: 'Nguyễn Bảo',
    lastName: 'Huy',
    email: 'huynguyen002311@gmail.com',
    phone: '0375686583',
    avatar: 'assets/images/user-profile-avatar.png',
    dob: '2005-09-22',
    isVerified: true,
    address: [
      {
        specific_address: 'Phường 26, quận Bình Thạnh, Tp. Hồ Chí Minh',
        postal_code: 55000,
        is_default: true,
      },
      {
        specific_address: 'hẻm 300, đường Nguyễn Tri Phương, Bình Dương',
        postal_code: 55000,
        is_default: false,
      },
    ],
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        // DANH SÁCH CÁC TRANG MUỐN ẨN HEADER LỚN
        const hideLargeHeaderOn = [
          'my-orders',
          'my-reviews',
          'my-payment-method',
          'my-promotions',
          'user-setting',
          'policy',
          'request-warranty',
          'support',
        ];

        // 1. Kiểm tra để ẩn/hiện Header lớn
        const shouldHideLarge = hideLargeHeaderOn.some((path) => currentUrl.includes(path));
        this.showHeaderProfile.set(!shouldHideLarge);

        // 2. LUÔN HIỂN THỊ AVATAR NHỎ TRONG SIDEBAR
        // Dù ở bất kỳ trang nào, ta cũng ép nó về true
        this.showUserInSidebar.set(true);

        console.log('DEBUG: Large Header hidden:', shouldHideLarge);
        console.log('DEBUG: Sidebar Avatar always visible: true');
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
