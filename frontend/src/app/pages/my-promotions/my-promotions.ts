import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ToastService } from '../../services/toast-service';
import { PromotionService } from '../../services/promotion-service';
import { UserService } from '../../services/user-service';
import { IUser, IVoucher } from '../../../interface';
import { formatDate } from '../../utils/utils';
@Component({
  selector: 'app-my-promotions',
  imports: [CommonModule, DecimalPipe],
  standalone: true,
  templateUrl: './my-promotions.html',
  styleUrl: './my-promotions.css',
})
export class MyPromotions implements OnInit {
  // Thông tin điểm thưởng của Huy
  vipInfo = signal({
    currentPoints: 0,
    vipLevel: 1,
    nextVipLevel: 2,
    pointsNeededForNext: 1000,
    maxPointsRange: 1000,
  });
  vipLevels = [
    { level: 1, min: 0, max: 999 },
    { level: 2, min: 1000, max: 1999 },
    { level: 3, min: 2000, max: 2999 },
    { level: 4, min: 3000, max: 4999 },
    { level: 5, min: 5000, max: 6999 },
    { level: 6, min: 7000, max: 9999 },
    { level: 7, min: 10000, max: 14999 },
    { level: 8, min: 15000, max: 19999 },
    { level: 9, min: 20000, max: 29999 },
    { level: 10, min: 30000, max: Infinity },
  ];
  userInfo: IUser | null = null;
  // Danh sách Voucher
  vouchers = signal([
    {
      id: 1,
      title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)', // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000,
    },
    {
      id: 2,
      title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)', // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000,
    },
    {
      id: 3,
      title: 'Voucher ngày lễ tình nhân Valentine',
      conditions: [
        'Chỉ áp dụng cho đơn hàng từ 6.900.000 VND',
        'Chỉ áp dụng với các sản phẩm làm bằng da',
        'Không áp dụng cho SP giảm giá > 30% (Theo BR-R-24)', // Cập nhật theo nguyên tắc
      ],
      expiryDate: '15/02/2026',
      value: 690000,
    },
  ]);
  error: string = '';
  userVouchers: IVoucher[] = [];
  userPoints: number = 0;
  constructor(
    private toastService: ToastService,
    private promotionService: PromotionService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.promotionService.getVouchers().subscribe({
      next: (res) => {
        this.userVouchers = res.data;
        console.log(this.userVouchers);
        this.cdr;
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy mã khuyến mãi nào ';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.promotionService.getUserPoints().subscribe({
      next: (res) => {
        this.userPoints = res.data;
        this.vipInfo.set({
          ...this.vipInfo(), // giữ các trường cũ
          currentPoints: res.data,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy mã khuyến mãi nào ';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        if (!res.data) {
          this.error = 'Không tìm thấy thông tin người dùng';
          this.cdr.detectChanges();
        }
        this.userInfo = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy thông tin người dùng ';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
  }
  calculateVip(points: number) {
    const current = this.vipLevels.find((v) => points >= v.min && points <= v.max);

    if (!current) return;

    const next = this.vipLevels.find((v) => v.level === current.level + 1);

    this.vipInfo.set({
      currentPoints: points,
      vipLevel: current.level,
      nextVipLevel: next ? next.level : current.level,
      pointsNeededForNext: next ? next.min - points : 0,
      maxPointsRange: current.max === Infinity ? points : current.max,
    });
  }
  formatDateTime(date: string | Date) {
    return formatDate(date);
  }
}
