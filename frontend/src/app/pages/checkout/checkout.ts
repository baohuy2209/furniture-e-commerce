import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStateService } from '../../services/cart-state-service';
import { OrderServices } from '../../services/order-services';
import { AddressService } from '../../services/address-service';
import { ToastService } from '../../services/toast-service';
import { IAddress } from '../../../interface';
interface ShippingMethod {
  id: string;
  name: string;
  desc: string; // ← thêm field này
  time: string;
  fee: number;
  icon: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const FREE_SHIPPING_THRESHOLD = 15_000_000;
@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  // ── State ─────────────────────────────────────────────────────────────
  addresses = signal<IAddress[]>([]);
  selectedAddressId = signal<string | null>(null);
  selectedShipping = signal<string | null>(null);
  selectedPayment = signal<string | null>(null);
  orderNote = '';
  loading = signal(false);
  placingOrder = signal(false);

  // ── Static data ───────────────────────────────────────────────────────
  shippingMethods: ShippingMethod[] = [
    {
      id: 'STANDARD_DELIVERY',
      name: 'Giao hàng tiêu chuẩn',
      desc: 'Giao đến trước cửa nhà / sảnh chung cư',
      time: '3–5 ngày',
      fee: 35000,
      icon: 'fa-truck',
    },
    {
      id: 'BULKY_DELIVERY',
      name: 'Giao hàng cồng kềnh',
      desc: 'Áp dụng cho sofa, tủ, giường lớn',
      time: '5–7 ngày',
      fee: 150000,
      icon: 'fa-truck-moving',
    },
    {
      id: 'WHITE_GLOVE_DELIVERY',
      name: 'Dịch vụ cao cấp (White Glove)',
      desc: 'Giao tận phòng + lắp đặt + thu dọn bao bì',
      time: '3–7 ngày',
      fee: 300000,
      icon: 'fa-hand-sparkles',
    },
    {
      id: 'SCHEDULED_DELIVERY',
      name: 'Giao theo lịch hẹn',
      desc: 'Chọn ngày & khung giờ giao hàng',
      time: 'Theo lịch hẹn',
      fee: 80000,
      icon: 'fa-calendar-check',
    },
    {
      id: 'EXPRESS_LARGE_ITEM',
      name: 'Giao nhanh hàng cồng kềnh',
      desc: 'Nội thành, phụ phí cao hơn',
      time: '1–2 ngày',
      fee: 250000,
      icon: 'fa-bolt',
    },
    {
      id: 'STORE_PICKUP',
      name: 'Nhận tại cửa hàng',
      desc: 'Đến trực tiếp showroom nhận hàng',
      time: 'Ngay hôm nay',
      fee: 0,
      icon: 'fa-store',
    },
    {
      id: 'WAREHOUSE_PICKUP',
      name: 'Nhận tại kho',
      desc: 'Áp dụng cho khách B2B hoặc đơn lớn',
      time: 'Theo giờ hành chính',
      fee: 0,
      icon: 'fa-warehouse',
    },
  ];

  paymentMethods: PaymentMethod[] = [
    { id: 'cod', name: 'Thanh toán khi nhận hàng', desc: 'COD', icon: 'fa-money-bill-wave' },
    {
      id: 'bank',
      name: 'Chuyển khoản ngân hàng',
      desc: 'Vietcombank, Techcombank...',
      icon: 'fa-building-columns',
    },
    { id: 'ewallet', name: 'Ví điện tử', desc: 'Momo / ZaloPay', icon: 'fa-wallet' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────
  subtotal = computed(() =>
    this.cartState.items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  discountTotal = computed(() =>
    this.cartState
      .items()
      .reduce((sum, i) => sum + i.price * (i.discount_percent / 100) * i.quantity, 0),
  );

  isFreeShipping = computed(
    () => this.subtotal() - this.discountTotal() >= FREE_SHIPPING_THRESHOLD,
  );

  shippingFee = computed(() => {
    if (!this.selectedShipping() || this.isFreeShipping()) return 0;
    return this.shippingMethods.find((m) => m.id === this.selectedShipping())?.fee ?? 0;
  });

  total = computed(() => this.subtotal() - this.discountTotal() + this.shippingFee());

  canPlaceOrder = computed(
    () =>
      !!this.selectedAddressId() &&
      !!this.selectedShipping() &&
      !!this.selectedPayment() &&
      !this.placingOrder() &&
      this.cartState.items().length > 0,
  );

  constructor(
    public cartState: CartStateService,
    private orderService: OrderServices,
    private addressService: AddressService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadAddresses();
    if (this.cartState.items().length === 0) {
      this.cartState.syncCart().subscribe();
    }
  }

  // ── Load địa chỉ từ AddressService ───────────────────────────────────
  loadAddresses() {
    this.loading.set(true);
    this.addressService.getAllAddressUser().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        const defaultAddr = res.data.find((a) => a.is_default);
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr._id);
        } else if (res.data.length > 0) {
          this.selectedAddressId.set(res.data[0]._id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Không tải được địa chỉ');
        this.loading.set(false);
      },
    });
  }

  // ── Selectors ─────────────────────────────────────────────────────────
  selectAddress(id: string) {
    this.selectedAddressId.set(id);
  }
  selectShipping(id: string) {
    this.selectedShipping.set(id);
  }
  selectPayment(id: string) {
    this.selectedPayment.set(id);
  }

  // ── Đặt hàng — gọi OrderServices.checkout() ──────────────────────────
  placeOrder() {
    if (!this.canPlaceOrder()) return;
    this.placingOrder.set(true);

    this.orderService
      .checkout(
        this.selectedAddressId()!,
        this.selectedShipping()!,
        this.shippingFee(),
        this.selectedPayment()!,
        this.orderNote,
      )
      .subscribe({
        next: () => {
          this.toastService.success('Đặt hàng thành công!');
          this.cartState.clearCart().subscribe();
          this.router.navigate(['/settings/my-orders']);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Đặt hàng thất bại');
          this.placingOrder.set(false);
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  }

  getShippingFeeDisplay(): string {
    if (!this.selectedShipping()) return 'Chọn phương thức';
    if (this.isFreeShipping()) return 'Miễn phí';
    return this.formatVND(this.shippingFee());
  }

  get tooltipMessage(): string {
    if (this.cartState.items().length === 0) return 'Giỏ hàng trống';
    if (!this.selectedAddressId()) return 'Vui lòng chọn địa chỉ giao hàng';
    if (!this.selectedShipping() && !this.selectedPayment())
      return 'Vui lòng chọn vận chuyển và thanh toán';
    if (!this.selectedShipping()) return 'Vui lòng chọn phương thức vận chuyển';
    return 'Vui lòng chọn phương thức thanh toán';
  }
}
