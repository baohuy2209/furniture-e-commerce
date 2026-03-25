import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderServices } from '../../services/order-services';
import { ToastService } from '../../services/toast-service';
import { IOrder, IOrderItem, IOrderItemShipping, IPayment } from '../../../interface';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs';
import { ReviewService } from '../../services/review-service';
// IOrder + IOrderItem gộp lại để hiển thị
export interface IOrderWithItems extends IOrder {
  items: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[];
  isExpanded: boolean;
  loadingItems: boolean;
}

// Map status IOrderItem → tab
const ITEM_STATUS_TAB: Record<IOrderItem['status'], string> = {
  pending: 'pending',
  packed: 'pending',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'returned',
};

export interface Tab {
  key: string;
  label: string;
  statuses: IOrderItem['status'][];
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders implements OnInit {
  // ── Tab config ────────────────────────────────────────────────────────
  tabs: Tab[] = [
    { key: 'pending', label: 'Chờ xử lý', statuses: ['pending', 'packed'] },
    { key: 'shipped', label: 'Đang giao', statuses: ['shipped'] },
    { key: 'delivered', label: 'Đã nhận', statuses: ['delivered'] },
    { key: 'returned', label: 'Đã trả', statuses: ['returned'] },
    { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'] },
  ];
  // ── State ─────────────────────────────────────────────────────────────
  allOrders = signal<IOrderWithItems[]>([]);
  activeTab = signal('pending');
  searchQuery = signal('');
  loading = signal(false);
  selectedFile: File[] = [];
  previewUrl: string[] = [];
  review = {
    rating: 0,
    comments: '',
  };
  selectedOrderItem: IOrderItem | null = null;
  error: string = '';
  // ── Computed ──────────────────────────────────────────────────────────
  activeTabStatuses = computed(
    () => this.tabs.find((t) => t.key === this.activeTab())?.statuses ?? [],
  );

  filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const statuses = this.activeTabStatuses();
    return this.allOrders().filter((order) => {
      // ✅ Giờ items đã đầy đủ khi set vào signal
      const hasMatchingItem = order.items.some((i) => statuses.includes(i.item.status));
      if (!hasMatchingItem) return false;
      if (!q) return true;
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.items.some((i) => i.item.product_name.toLowerCase().includes(q))
      );
    });
  });

  // Items của order đang xem theo tab hiện tại
  getTabItems(
    order: IOrderWithItems,
  ): { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[] {
    const statuses = this.activeTabStatuses();
    return order.items.filter((i) => statuses.includes(i.item.status));
  }

  // Badge count per tab
  countForTab(tabKey: string): number {
    const statuses = this.tabs.find((t) => t.key === tabKey)?.statuses ?? [];
    return this.allOrders().filter((o) => o.items.some((i) => statuses.includes(i.item.status)))
      .length;
  }

  constructor(
    private orderService: OrderServices,
    private reviewService: ReviewService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }
  submitReview(form: any) {
    if (form.invalid || this.review.rating === 0) {
      this.toastService.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    this.reviewService
      .createReviewProduct(
        this.review.rating,
        this.review.comments,
        this.selectedFile,
        this.selectedOrderItem?._id!,
      )
      .subscribe({
        next: (res) => {
          if (res.data.assignedVoucher != null) {
            this.toastService.success(
              `Bạn đã hoàn thành đánh giá và được tặng thêm voucher ${res.data.assignedVoucher.voucher_name}`,
            );
          }
          this.toastService.success(res.message);
          form.reset();
          this.selectedFile = [];
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.cdr.detectChanges();
        },
      });
    console.log(form);
    console.log(this.review);
    console.log(this.selectedFile);
    console.log(this.selectedOrderItem);
  }
  onClickOrderItem(item: IOrderItem) {
    this.selectedOrderItem = item;
  }
  onImageSelect(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      for (let file of files) {
        this.selectedFile.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }
  // ── Load tất cả đơn hàng ─────────────────────────────────────────────
  loadOrders() {
    this.loading.set(true);
    this.orderService.getUserOrders().subscribe({
      next: (res) => {
        const orders = res.data;
        if (orders.length === 0) {
          this.allOrders.set([]);
          this.loading.set(false);
          return;
        }

        const detailRequests = orders.map((order: IOrder) =>
          this.orderService.getOrderDetail(order._id).pipe(
            map((res) => {
              return {
                ...order,
                items: res.data.items,
                isExpanded: false,
                loadingItems: false,
              };
            }),
          ),
        );

        forkJoin(detailRequests).subscribe({
          next: (ordersWithItems) => {
            this.allOrders.set(ordersWithItems as IOrderWithItems[]);
            // console.log(ordersWithItems);
            this.loading.set(false);
          },
          error: () => {
            this.toastService.error('Không tải được chi tiết đơn hàng');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Không tải được đơn hàng');
        this.loading.set(false);
      },
    });
  }

  // ── Toggle expand ─────────────────────────────────────────────────────
  toggleExpand(order: IOrderWithItems) {
    this.allOrders.update((orders) =>
      orders.map((o) => (o._id === order._id ? { ...o, isExpanded: !o.isExpanded } : o)),
    );
  }

  // ── Status helpers ────────────────────────────────────────────────────
  getStatusLabel(status: IOrderItem['status']): string {
    const map: Record<string, string> = {
      pending: 'Chờ xác nhận',
      packed: 'Đang đóng gói',
      shipped: 'Đang giao',
      delivered: 'Đã nhận',
      cancelled: 'Đã hủy',
      returned: 'Đã trả',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: IOrderItem['status']): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      packed: 'status-packed',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      returned: 'status-returned',
    };
    return map[status] ?? '';
  }

  // ── Tính tổng ─────────────────────────────────────────────────────────
  calcItemTotal(item: IOrderItem): number {
    return item.item_subtotal;
  }

  // ── Format tiền ──────────────────────────────────────────────────────
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  }
}
