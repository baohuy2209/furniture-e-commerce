import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-my-promotions',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './my-promotions.html',
  styleUrl: './my-promotions.css'
})
export class MyPromotions {
  // Thông tin điểm thưởng của Huy
  userPoints = signal({
    currentPoints: 3000,
    vipLevel: 3,
    nextVipLevel: 4,
    pointsNeededForNext: 1000,
    maxPointsRange: 10000,
    formula: '10.000.000 VNĐ = 1 điểm',
    redeemRule: '100 điểm = 10.000.000 VNĐ giảm giá'
  });

  // Danh sách Voucher
  vouchers = signal([
    {
      id: 1,
      title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)' // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000
    },
    {
      id: 2,
      title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)' // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000
    },
    {
      id: 3,
     title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)' // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000
    },
  ]);
}