import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-breadcrumb',
  imports: [],
  templateUrl: './settings-breadcrumb.html',
  styleUrl: './settings-breadcrumb.css',
})
export class SettingsBreadcrumb {
  constructor(private router: Router) {}
  getCurrentUrl(): string[] {
    const getCurrents = this.router.url.split('/');
    getCurrents.shift();
    var list_slug = getCurrents;
    return list_slug.map((slug) => this.convertUrl(slug));
  }
  convertUrl(slug: string): string {
    var convert_slug = '';
    switch (slug) {
      case 'my-orders':
        convert_slug = 'Đơn hàng của tôi';
        break;
      case 'my-payment-method':
        convert_slug = 'Thanh toán';
        break;
      case 'my-promotions':
        convert_slug = 'Khuyến mãi của tôi';
        break;
      case 'policy':
        convert_slug = 'Điều khoản chính sách';
        break;
      case 'user-setting':
        convert_slug = 'Cài đặt thông báo';
        break;
      case 'support':
        convert_slug = 'Hỗ trợ chăm sóc khách hàng';
        break;
      case 'my-reviews':
        convert_slug = 'Đánh giá của tôi';
    }
    return convert_slug;
  }
}
