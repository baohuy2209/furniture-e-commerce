import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-sidebar',
  imports: [CommonModule],
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css',
})
export class SettingsSidebar {
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
  constructor(private router: Router) {}
  getCurrentUrl() {
    const getCurrents = this.router.url.split('/');
    return getCurrents[1] == '' ? 'home' : getCurrents[1];
  }
  changeHref(href: string): string {
    return href.split('/')[1];
  }
}
