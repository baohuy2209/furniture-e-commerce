import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SettingsSidebar } from '../../account-settings/settings-sidebar/settings-sidebar';
import { HeaderProfile } from '../../account-settings/header-profile/header-profile';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";

@Component({
  selector: 'app-setting-layout',
  standalone: true,
  imports: [RouterOutlet, SettingsSidebar, HeaderProfile, Header, Footer],
  templateUrl: './setting-layout.html',
  styleUrl: './setting-layout.css',
})
export class SettingLayout {
  list_menu = [
    {
      id: 1,
      name: 'Thông tin cá nhân',
      href: '/user-profile',
      iconClass: 'fa-solid fa-user',
    },
    {
      id: 2,
      name: 'Đổi mật khẩu',
      href: '/change-password',
      iconClass: 'fa-solid fa-pen',
    },
    {
      id: 3,
      name: 'Đơn hàng của tôi',
      href: '/my-orders',
      iconClass: 'fa-solid fa-receipt',
    },
    {
      id: 4,
      name: 'Dánh giá sản phẩm',
      href: '/my-reviews',
      iconClass: 'fa-solid fa-comment-dollar',
    },
    {
      id: 5,
      name: 'Thanh toán',
      href: '/my-payment-method',
      iconClass: 'fa-solid fa-money-bills',
    },
    {
      id: 6,
      name: 'Khuyến mãi',
      href: '/my-promotions',
      iconClass: 'fa-solid fa-percent',
    },
    {
      id: 7,
      name: 'Chính sách',
      href: '/policy',
      iconClass: 'fa-solid fa-handcuffs',
    },
    {
      id: 8,
      name: 'Cài đặt',
      href: '/user-setting',
      iconClass: 'fa-solid fa-bars',
    },
    {
      id: 9,
      name: 'Bảo hành',
      href: '/request-warranty',
      iconClass: 'fa-solid fa-user-shield',
    },
    {
      id: 10,
      name: 'Hỗ trợ',
      href: '/support',
      iconClass: 'fa-solid fa-person-circle-question',
    },
  ];
  user = {
    username: 'baohuy2209',
    firstName: 'Nguyễn Bảo',
    lastName: 'Huy',
    email: 'huynguyen002311@gmail.com',
    phone: '0375686583',
    avatar: 'user/image.png',
    dob: '2005-09-22',
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
  getCurrentUrl() {
    const getCurrents = this.router.url.split('/');
    return getCurrents[1] == '' ? 'home' : getCurrents[1];
  }
  changeHref(href: string): string {
    return href.split('/')[1];
  }
}
