import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { filter, Subscription } from 'rxjs';
import { SettingsSidebar } from '../../account-settings/settings-sidebar/settings-sidebar';
import { HeaderProfile } from '../../account-settings/header-profile/header-profile';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../../interface';

@Component({
  selector: 'app-setting-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, SettingsSidebar, HeaderProfile],
  templateUrl: './setting-layout.html',
  styleUrl: './setting-layout.css',
})
export class SettingLayout {
  showHeaderProfile = signal(true);
  showUserInSidebar = signal(true);
  user = signal<IUser | null>(null);
  private routerSubscription!: Subscription;

  list_menu = [
    { id: 1, name: 'Thông tin cá nhân', href: '/settings', iconClass: 'fa-solid fa-user' },
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
      href: '/settings/requests-warranty',
      iconClass: 'fa-solid fa-user-shield',
    },
    {
      id: 10,
      name: 'Hỗ trợ',
      href: '/settings/support',
      iconClass: 'fa-solid fa-person-circle-question',
    },
  ];

  error: string = '';
  constructor(
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

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
          'requests-warranty',
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
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        this.user.set(res.data);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
