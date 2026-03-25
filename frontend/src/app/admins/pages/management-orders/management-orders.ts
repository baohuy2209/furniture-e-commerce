import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil, finalize } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import {
  OrderServices,
  IOrderDetailResponse,
  IOrderItemDetail,
} from '../../../services/order-services';
import { IOrderAdmin, IOrderItem, IOrderItemShipping, IPayment } from '../../../../interface';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'list' | 'detail';
type SortDir = 'asc' | 'desc';
type SortKey =
  | 'order_number'
  | 'customer'
  | 'status'
  | 'payment_status'
  | 'createdAt'
  | 'total_amount';
type ItemStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
type PaymentItemStatus = 'pending' | 'completed' | 'failed';

// ─── View Models ─────────────────────────────────────────────────────────────

/** Mỗi "dòng" trong danh sách sản phẩm của đơn hàng */
interface OrderItemRowVM {
  item: IOrderItem;
  shipping: IOrderItemShipping | null;
  payment: IPayment | null;
  unitPriceText: string;
  subtotalText: string;
  statusLabel: string;
  statusPillClass: string;
  paymentLabel: string;
  paymentPillClass: string;
  shippingMethod: string;
  shippingFeeText: string;
}

interface TimelineItemVM {
  key: string;
  title: string;
  desc: string;
  atText: string;
  done: boolean;
}

interface OrderDetailVM {
  order: IOrderAdmin;
  itemRows: OrderItemRowVM[];
  customerName: string;
  customerEmail: string;
  beforeTotalText: string;
  discountTotalText: string;
  shippingFeeText: string;
  totalText: string;
  statusLabel: string;
  statusPillClass: string;
  paymentLabel: string;
  payPillClass: string;
  /**
   * Có thể huỷ khi TẤT CẢ items đang ở 'pending'
   * (backend sẽ set cancelled cho từng item)
   */
  canCancel: boolean;
  timeline: TimelineItemVM[];
}

interface ListRowVM {
  id: string;
  order_number: string;
  customer: string;
  customerEmail: string;
  status: string;
  payment_status: string;
  total_amount: number;
  createdAt: string | Date;
  statusLabel: string;
  statusPillClass: string;
  paymentLabel: string;
  payPillClass: string;
  totalText: string;
  createdAtText: string;
  stt: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-management-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal, DatePipe],
  templateUrl: './management-orders.html',
  styleUrls: ['./management-orders.css'],
})
export class ManagementOrders implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mode: Mode = 'list';
  selectedId: string | null = null;

  // ── Loading / error states ────────────────────────────────────────────────
  loading = false;
  detailLoading = false;
  detailError = false;

  // ── Data streams ─────────────────────────────────────────────────────────
  private orders$ = new BehaviorSubject<IOrderAdmin[]>([]);
  detail: OrderDetailVM | null = null;

  // ── Modals ───────────────────────────────────────────────────────────────
  cancelModalOpen = false;
  cancelTargetId: string | null = null;

  updateItemStatusModalOpen = false;
  updateItemStatusTargetId: string | null = null;
  updateItemStatusValue: ItemStatus = 'pending';

  updatePaymentModalOpen = false;
  updatePaymentTargetId: string | null = null;
  updatePaymentValue: PaymentItemStatus = 'pending';

  // ── Filters ──────────────────────────────────────────────────────────────
  q = '';
  f_status = '';
  f_payment = '';
  page = 1;
  pageSize = 10;

  private q$ = new BehaviorSubject<string>('');
  private status$ = new BehaviorSubject<string>('');
  private payment$ = new BehaviorSubject<string>('');
  private page$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);
  private sortKey$ = new BehaviorSubject<SortKey>('createdAt');
  private sortDir$ = new BehaviorSubject<SortDir>('desc');

  // ── Options ──────────────────────────────────────────────────────────────
  readonly itemStatusOptions: { value: ItemStatus; label: string }[] = [
    { value: 'pending', label: 'Chờ soạn hàng' },
    { value: 'packed', label: 'Đã đóng gói' },
    { value: 'shipped', label: 'Đã xuất kho' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã huỷ' },
    { value: 'returned', label: 'Trả hàng' },
  ];

  readonly paymentItemStatusOptions: { value: PaymentItemStatus; label: string }[] = [
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'completed', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thất bại' },
  ];

  // ── VM stream ────────────────────────────────────────────────────────────
  vm$ = combineLatest([
    this.orders$,
    this.q$,
    this.status$,
    this.payment$,
    this.page$,
    this.pageSize$,
    this.sortKey$,
    this.sortDir$,
  ]).pipe(
    map(([orders, q, status, payment, page, pageSize, sortKey, sortDir]) => {
      const keyword = q.trim().toLowerCase();

      const computedRows: ListRowVM[] = orders.map((o) => ({
        id: o._id,
        order_number: o.order_number,
        customer: o.user_id?.name ?? '—',
        customerEmail: o.user_id?.email ?? '—',
        status: o.status,
        payment_status: o.payment_status,
        total_amount: o.total_amount,
        createdAt: o.createdAt,
        statusLabel: orderStatusLabel(o.status),
        statusPillClass: orderStatusPill(o.status),
        paymentLabel: paymentStatusLabel(o.payment_status),
        payPillClass: paymentStatusPill(o.payment_status),
        totalText: money(o.total_amount),
        createdAtText: fmtDate(String(o.createdAt)),
        stt: 0,
      }));

      let filtered = computedRows.filter((r) => {
        if (keyword.length >= 2) {
          const hit =
            r.order_number.toLowerCase().includes(keyword) ||
            r.customer.toLowerCase().includes(keyword) ||
            r.customerEmail.toLowerCase().includes(keyword);
          if (!hit) return false;
        }
        if (status && r.status !== status) return false;
        if (payment && r.payment_status !== payment) return false;
        return true;
      });

      filtered.sort((a, b) => cmpByKey(a, b, sortKey, sortDir));

      const exportRows = filtered.slice();
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = clamp(page, 1, totalPages);
      const start = (safePage - 1) * pageSize;
      const rows = filtered
        .slice(start, start + pageSize)
        .map((r, i) => ({ ...r, stt: start + i + 1 }));

      const summary = {
        totalRevenue: money(orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)),
        pendingCount: orders.filter((o) => o.status === 'uncompleted').length,
        completedCount: orders.filter((o) => o.status === 'completed').length,
      };

      return {
        rows,
        exportRows,
        total,
        page: safePage,
        pageSize,
        totalPages,
        sortKey,
        sortDir,
        summary,
      };
    }),
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderServices,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load danh sách ────────────────────────────────────────────────────────
  private loadAll(): void {
    this.loading = true;
    this.orderService
      .getAllOrdersAdmin()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => this.orders$.next(Array.isArray(res?.data) ? res.data : []),
        error: () => this.orders$.next([]),
      });
  }

  // ── Load chi tiết ─────────────────────────────────────────────────────────
  /**
   * Backend trả về:
   * {
   *   message: string,
   *   data: {
   *     order: IOrderAdmin,
   *     items: Array<{ item: IOrderItem, shipping: IOrderItemShipping|null, payment: IPayment|null }>
   *   }
   * }
   */
  private loadDetail(orderId: string): void {
    this.detail = null;
    this.detailError = false;
    this.detailLoading = true;
    this.cdr.detectChanges();

    this.orderService
      .getOrderDetailAdmin(orderId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.detailLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res: any) => {
          // Normalize response — handle cả wrap và không wrap
          const payload: IOrderDetailResponse = res?.data ?? res;
          const order: IOrderAdmin = payload?.order;
          const rawItems: IOrderItemDetail[] = Array.isArray(payload?.items) ? payload.items : [];

          if (!order?._id) {
            this.detailError = true;
            this.cdr.detectChanges();
            return;
          }

          this.detail = this.buildDetailVM(order, rawItems);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[ManagementOrders] loadDetail error:', err);
          this.detailError = true;
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Build VM từ đúng cấu trúc backend:
   * items = [{ item, shipping, payment }]
   */
  private buildDetailVM(order: IOrderAdmin, rawItems: IOrderItemDetail[]): OrderDetailVM {
    const itemRows: OrderItemRowVM[] = rawItems.map(({ item, shipping, payment }) => ({
      item,
      shipping,
      payment,
      unitPriceText: money(item.unit_price ?? 0),
      subtotalText: money(item.item_subtotal ?? 0),
      statusLabel: itemStatusLabel(item.status),
      statusPillClass: itemStatusPill(item.status),
      paymentLabel: paymentItemLabel(payment?.status ?? ''),
      paymentPillClass: paymentItemPill(payment?.status ?? ''),
      shippingMethod: shipping?.shipping_method ?? '—',
      shippingFeeText: money(shipping?.shipping_fee ?? 0),
    }));

    // Đơn hàng có thể bị huỷ khi TẤT CẢ items đang pending
    const canCancel = itemRows.length > 0 && itemRows.every((r) => r.item.status === 'pending');

    return {
      order,
      itemRows,
      customerName: order.user_id?.name ?? '—',
      customerEmail: order.user_id?.email ?? '—',
      beforeTotalText: money(order.before_total ?? 0),
      discountTotalText: money(order.discount_total ?? 0),
      shippingFeeText: money(order.total_shipping_fee ?? 0),
      totalText: money(order.total_amount ?? 0),
      statusLabel: orderStatusLabel(order.status),
      statusPillClass: orderStatusPill(order.status),
      paymentLabel: paymentStatusLabel(order.payment_status),
      payPillClass: paymentStatusPill(order.payment_status),
      canCancel,
      timeline: buildTimeline(order, rawItems),
    };
  }

  // ── Route ─────────────────────────────────────────────────────────────────
  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      if (!id) {
        this.selectedId = null;
        this.mode = 'list';
        this.detail = null;
        this.detailError = false;
        return;
      }
      if (id !== this.selectedId) {
        this.selectedId = id;
        this.mode = 'detail';
        this.loadDetail(id);
      }
    });
  }

  private syncRoute(id: string | null, push: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: id ?? null },
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  openDetail(orderId: string): void {
    this.syncRoute(orderId, true);
  }
  goList(): void {
    this.syncRoute(null, true);
  }
  onHeaderBack(): void {
    this.goList();
  }
  retryDetail(): void {
    if (this.selectedId) this.loadDetail(this.selectedId);
  }
  stopEvent(ev: MouseEvent): void {
    ev.stopPropagation();
    ev.preventDefault();
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  onChangeQ(v: string): void {
    this.q = v;
    this.q$.next(v);
    this.page$.next(1);
  }
  onChangeStatus(v: string): void {
    this.f_status = v;
    this.status$.next(v);
    this.page$.next(1);
  }
  onChangePayment(v: string): void {
    this.f_payment = v;
    this.payment$.next(v);
    this.page$.next(1);
  }
  onChangePageSize(v: number): void {
    this.pageSize = Number(v) || 10;
    this.pageSize$.next(this.pageSize);
    this.page$.next(1);
  }

  resetFilters(): void {
    this.q = '';
    this.f_status = '';
    this.f_payment = '';
    this.pageSize = 10;
    this.q$.next('');
    this.status$.next('');
    this.payment$.next('');
    this.pageSize$.next(10);
    this.page$.next(1);
  }

  setPage(p: number): void {
    this.page = p;
    this.page$.next(p);
  }

  toggleSort(key: SortKey): void {
    const cur = this.sortKey$.value;
    const dir = this.sortDir$.value;
    if (cur === key) {
      this.sortDir$.next(dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey$.next(key);
      this.sortDir$.next('asc');
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey$.value !== key) return 'fa-sort';
    return this.sortDir$.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // ── Cancel order ─────────────────────────────────────────────────────────
  confirmCancel(orderId: string): void {
    this.cancelTargetId = orderId;
    this.cancelModalOpen = true;
  }
  onCancelOrderDismiss(): void {
    this.cancelModalOpen = false;
    this.cancelTargetId = null;
  }

  /**
   * Huỷ từng item đang 'pending' — backend tự hoàn thành order khi tất cả items done
   */
  onConfirmCancelOrder(): void {
    const id = this.cancelTargetId;
    this.cancelModalOpen = false;
    this.cancelTargetId = null;
    if (!id || !this.detail) return;

    const pendingIds = this.detail.itemRows
      .filter((r) => r.item.status === 'pending')
      .map((r) => r.item._id);

    if (!pendingIds.length) return;

    let idx = 0;
    const doNext = () => {
      if (idx >= pendingIds.length) {
        this.loadAll();
        this.loadDetail(id);
        return;
      }
      this.orderService
        .updateOrderItemStatus(pendingIds[idx], 'cancelled')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            idx++;
            doNext();
          },
          error: () => {
            idx++;
            doNext();
          },
        });
    };
    doNext();
  }

  // ── Update item status ────────────────────────────────────────────────────
  openUpdateItemStatus(itemId: string, current: ItemStatus): void {
    this.updateItemStatusTargetId = itemId;
    this.updateItemStatusValue = current;
    this.updateItemStatusModalOpen = true;
  }
  onCancelItemStatus(): void {
    this.updateItemStatusModalOpen = false;
    this.updateItemStatusTargetId = null;
  }

  onConfirmItemStatus(): void {
    const id = this.updateItemStatusTargetId;
    const status = this.updateItemStatusValue;
    this.updateItemStatusModalOpen = false;
    this.updateItemStatusTargetId = null;
    if (!id) return;
    this.orderService
      .updateOrderItemStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAll();
          if (this.selectedId) this.loadDetail(this.selectedId);
        },
      });
  }

  // ── Update payment status ─────────────────────────────────────────────────
  openUpdatePayment(paymentId: string, current: PaymentItemStatus): void {
    this.updatePaymentTargetId = paymentId;
    this.updatePaymentValue = current;
    this.updatePaymentModalOpen = true;
  }
  onCancelPayment(): void {
    this.updatePaymentModalOpen = false;
    this.updatePaymentTargetId = null;
  }

  onConfirmPayment(): void {
    const id = this.updatePaymentTargetId;
    const status = this.updatePaymentValue;
    this.updatePaymentModalOpen = false;
    this.updatePaymentTargetId = null;
    if (!id) return;
    this.orderService
      .updatePaymentStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAll();
          if (this.selectedId) this.loadDetail(this.selectedId);
        },
      });
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exportCsv(rows: ListRowVM[]): void {
    const headers = [
      'id',
      'order_number',
      'customer',
      'email',
      'status',
      'payment_status',
      'created_at',
      'total_amount',
    ];
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.order_number,
          csvSafe(r.customer),
          r.customerEmail,
          r.status,
          r.payment_status,
          r.createdAt,
          r.total_amount,
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  moneyFmt(v: number): string {
    return money(v);
  }
  payItemLabel(s: string): string {
    return paymentItemLabel(s);
  }
  payItemClass(s: string): string {
    return paymentItemPill(s);
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Label cho Order.status (uncompleted / completed) và OrderItem.status */
function orderStatusLabel(s: string): string {
  const m: Record<string, string> = {
    uncompleted: 'Chưa hoàn tất',
    completed: 'Hoàn tất',
    pending: 'Chờ soạn hàng',
    packed: 'Đã đóng gói',
    shipped: 'Đã xuất kho',
    delivered: 'Đã giao',
    cancelled: 'Đã huỷ',
    returned: 'Trả hàng',
  };
  return m[s] ?? s;
}

function itemStatusLabel(s: string): string {
  return orderStatusLabel(s);
}

function orderStatusPill(s: string): string {
  const m: Record<string, string> = {
    uncompleted: 'pill-pending',
    completed: 'pill-delivered',
    pending: 'pill-pending',
    packed: 'pill-packed',
    shipped: 'pill-shipping',
    delivered: 'pill-delivered',
    cancelled: 'pill-cancelled',
    returned: 'pill-returned',
  };
  return m[s] ?? '';
}

function itemStatusPill(s: string): string {
  return orderStatusPill(s);
}

/** Label cho Order.payment_status (unpaid / paid / refunded) */
function paymentStatusLabel(p: string): string {
  const m: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    paid: 'Đã thanh toán',
    refunded: 'Đã hoàn tiền',
  };
  return m[p] ?? p;
}

function paymentStatusPill(p: string): string {
  const m: Record<string, string> = {
    unpaid: 'pill-unpaid',
    paid: 'pill-paid',
    refunded: 'pill-refunded',
  };
  return m[p] ?? '';
}

/** Label cho Payment.status (pending / completed / failed) */
function paymentItemLabel(s: string): string {
  const m: Record<string, string> = {
    pending: 'Chờ TT',
    completed: 'Đã TT',
    failed: 'Thất bại',
  };
  return m[s] ?? s;
}

function paymentItemPill(s: string): string {
  const m: Record<string, string> = {
    pending: 'pill-unpaid',
    completed: 'pill-paid',
    failed: 'pill-cancelled',
  };
  return m[s] ?? '';
}

function money(v: number): string {
  try {
    return new Intl.NumberFormat('vi-VN').format(v ?? 0) + ' ₫';
  } catch {
    return `${v ?? 0} ₫`;
  }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function csvSafe(v: string): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cmpByKey(a: any, b: any, key: string, dir: SortDir): number {
  const va = a[key];
  const vb = b[key];
  let cmp = 0;
  if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
  else cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'vi', { numeric: true });
  return dir === 'asc' ? cmp : -cmp;
}

function buildTimeline(order: IOrderAdmin, rawItems: IOrderItemDetail[]): TimelineItemVM[] {
  const statuses = rawItems.map((r) => r.item.status);
  const has = (s: string) => statuses.includes(s as ItemStatus);
  const crt = fmtDate(String(order.createdAt));
  const upd = fmtDate(String(order.updatedAt));

  const steps: TimelineItemVM[] = [
    {
      key: 'created',
      title: 'Đặt hàng',
      desc: `Mã đơn: ${order.order_number}`,
      atText: crt,
      done: true,
    },
    {
      key: 'packed',
      title: 'Đóng gói',
      desc: 'Đơn đang được chuẩn bị.',
      atText: has('packed') || has('shipped') || has('delivered') ? upd : '—',
      done: has('packed') || has('shipped') || has('delivered'),
    },
    {
      key: 'shipped',
      title: 'Xuất kho / Đang giao',
      desc: 'Hàng đã rời kho.',
      atText: has('shipped') || has('delivered') ? upd : '—',
      done: has('shipped') || has('delivered'),
    },
    {
      key: 'delivered',
      title: 'Đã giao',
      desc: 'Giao hàng thành công.',
      atText: has('delivered') ? upd : '—',
      done: has('delivered'),
    },
  ];

  if (has('cancelled')) {
    steps.push({
      key: 'cancelled',
      title: 'Đã huỷ',
      desc: order.cancel_reason ? `Lý do: ${order.cancel_reason}` : 'Đơn bị huỷ.',
      atText: upd,
      done: true,
    });
  }
  if (has('returned')) {
    steps.push({
      key: 'returned',
      title: 'Trả hàng',
      desc: 'Hàng đã trả lại.',
      atText: upd,
      done: true,
    });
  }
  if (order.status === 'completed') {
    steps.push({
      key: 'completed',
      title: 'Hoàn tất đơn',
      desc: 'Đơn hàng đã hoàn tất.',
      atText: fmtDate(String((order as any).completed_at ?? order.updatedAt)),
      done: true,
    });
  }

  return steps;
}
