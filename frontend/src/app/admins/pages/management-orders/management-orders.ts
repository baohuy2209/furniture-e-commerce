import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { AdminOrderService } from '../../../services/admin-order.service';

/** ===================== TYPES ===================== */
type Mode = 'list' | 'detail' | 'edit';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'exchange_requested'
  | 'exchanged'
  | 'uncompleted'
  | 'completed';

type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

type SortDir = 'asc' | 'desc';
type SortKey =
  | 'order_number'
  | 'customer'
  | 'phone'
  | 'region'
  | 'status'
  | 'payment_status'
  | 'created_at'
  | 'total_amount';

interface OrderEntity {
  order_id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  region: string;
  shipping_fee: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  note: string;
  admin_note: string;
  cancel_reason: string;
  created_at: string;
  delivered_at: string | null;
  updated_at: string;
}

interface UserEntity {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface AddressEntity {
  receiver_name: string;
  receiver_phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
}

interface OrderItemEntity {
  order_item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string;
  product_variant_id: string;
  unit_price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

type RequestType = 'return' | 'exchange';
type RequestStatus = 'requested' | 'approved' | 'rejected' | 'completed';

interface ReturnExchangeRequestEntity {
  request_id: string;
  order_id: string;
  type: RequestType;
  reason: string;
  note: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

interface OrderListRow extends Pick<
  OrderEntity,
  | 'order_id'
  | 'order_number'
  | 'status'
  | 'payment_status'
  | 'region'
  | 'created_at'
  | 'delivered_at'
  | 'total_amount'
> {
  customer: string;
  phone: string;
  email: string;
}

interface VMListRow extends OrderListRow {
  createdAtText: string;
  totalText: string;
  statusLabel: string;
  statusPillClass: string;
  paymentLabel: string;
  payPillClass: string;
  stt: number;
}

interface TimelineItemVM {
  key: string;
  title: string;
  desc: string;
  atText: string;
  done: boolean;
}

interface OrderDetailVM {
  order: OrderEntity;
  user: UserEntity | null;
  address: AddressEntity | null;

  items: Array<
    OrderItemEntity & {
      item_subtotal: number;
      unitPriceText: string;
      subtotalText: string;
    }
  >;

  userFullName: string;
  addressText: string;

  createdAtText: string;
  deliveredAtText: string;

  beforeTotalText: string;
  discountTotalText: string;
  shippingFeeText: string;
  totalText: string;

  statusLabel: string;
  statusPillClass: string;
  paymentLabel: string;
  payPillClass: string;

  canCancel: boolean;
  canApproveRequest: boolean;
  canRejectRequest: boolean;
  canMarkCompleted: boolean;

  request: (ReturnExchangeRequestEntity & { createdAtText: string; isWithin7Days: boolean }) | null;

  timeline: TimelineItemVM[];
}

interface VM {
  mode: Mode;
  rows: VMListRow[];
  exportRows: VMListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortKey: SortKey;
  sortDir: SortDir;
  regions: string[];
  showingFrom: number;
  showingTo: number;
  selectedId: string | null;
  detail: OrderDetailVM | null;
  editModel: Partial<OrderEntity> | null;
  summary?: {
    totalRevenue: string;
    pendingCount: number;
    shippingCount: number;
  };
}

interface OrderDetailRaw {
  order: OrderEntity;
  user: UserEntity | null;
  address: AddressEntity | null;
  items: OrderItemEntity[];
  request: ReturnExchangeRequestEntity | null;
}

/** ===================== COMPONENT ===================== */

@Component({
  selector: 'app-management-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal],
  templateUrl: './management-orders.html',
  styleUrls: ['./management-orders.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementOrders implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminOrderService = inject(AdminOrderService);
  private destroy$ = new Subject<void>();

  private rows$ = new BehaviorSubject<OrderListRow[]>([]);
  private total$ = new BehaviorSubject<number>(0);
  private summary$ = new BehaviorSubject<{ totalRevenue: string; pendingCount: number; shippingCount: number } | undefined>(undefined);

  private mode$ = new BehaviorSubject<Mode>('list');
  private selectedId$ = new BehaviorSubject<string | null>(null);
  private detail$ = new BehaviorSubject<OrderDetailVM | null>(null);
  private editModel$ = new BehaviorSubject<Partial<OrderEntity> | null>(null);

  private originalEditSnapshot: string | null = null;
  private pendingDiscardAction: (() => void) | null = null;

  saveModalOpen = false;
  discardModalOpen = false;
  cancelModalOpen = false;
  cancelTargetOrderId: string | null = null;

  // Filters
  q = '';
  f_status: '' | OrderStatus = '';
  f_payment: '' | PaymentStatus = '';
  f_region = '';

  page = 1;
  pageSize = 10;

  private q$ = new BehaviorSubject<string>('');
  private status$ = new BehaviorSubject<'' | OrderStatus>('');
  private payment$ = new BehaviorSubject<'' | PaymentStatus>('');
  private region$ = new BehaviorSubject<string>('');
  private page$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);

  private sortKey$ = new BehaviorSubject<SortKey>('created_at');
  private sortDir$ = new BehaviorSubject<SortDir>('desc');

  private refreshList$ = new BehaviorSubject<void>(undefined);
  private refreshStats$ = new BehaviorSubject<void>(undefined);

  vm$ = combineLatest([
    this.mode$,
    this.selectedId$,
    this.detail$,
    this.editModel$,
    this.rows$,
    this.total$,
    this.summary$,
    this.q$,
    this.status$,
    this.payment$,
    this.region$,
    this.page$,
    this.pageSize$,
    this.sortKey$,
    this.sortDir$,
  ]).pipe(
    map(
      ([
        mode,
        selectedId,
        detail,
        editModel,
        rows,
        totalCount,
        summary,
        q,
        status,
        payment,
        region,
        page,
        pageSize,
        sortKey,
        sortDir,
      ]) => {
        const regions = this.buildRegions(rows);

        const computedRows: VMListRow[] = rows.map((r, i) => {
          const start = (page - 1) * pageSize;
          return {
            ...r,
            stt: start + i + 1,
            createdAtText: this.fmtDate(r.created_at),
            totalText: money(r.total_amount),
            statusLabel: this.statusLabel(r.status),
            statusPillClass: this.statusPillClass(r.status),
            paymentLabel: this.paymentLabel(r.payment_status),
            payPillClass: this.paymentPillClass(r.payment_status),
          };
        });

        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const safePage = clamp(page, 1, totalPages);
        const start = (safePage - 1) * pageSize;

        const showingFrom = totalCount === 0 ? 0 : start + 1;
        const showingTo = totalCount === 0 ? 0 : Math.min(totalCount, start + rows.length);

        const vm: VM = {
          mode,
          rows: computedRows,
          exportRows: computedRows, // In a real app, exportRows might need a separate API call for all results
          total: totalCount,
          page: safePage,
          pageSize,
          totalPages,
          sortKey,
          sortDir,
          regions,
          showingFrom,
          showingTo,
          selectedId,
          detail: mode !== 'list' ? detail : null,
          editModel: mode === 'edit' ? editModel : null,
          summary,
        };
        return vm;
      },
    ),
  );

  ngOnInit(): void {
    this.bindRouteState();
    this.initDataFetch();
  }

  private initDataFetch(): void {
    // Stats fetch
    this.refreshStats$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.adminOrderService.getStatistics().subscribe((stats) => {
        this.summary$.next({
          totalRevenue: money(stats.totalRevenue),
          pendingCount: stats.pendingCount,
          shippingCount: stats.shippingCount,
        });
      });
    });

    // List fetch reactive to filters
    combineLatest([
      this.refreshList$,
      this.q$,
      this.status$,
      this.payment$,
      this.region$,
      this.page$,
      this.pageSize$,
      this.sortKey$,
      this.sortDir$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([_, q, status, payment, region, page, pageSize, sortKey, sortDir]) => {
        const params = {
          q,
          status,
          payment_status: payment,
          region,
          page,
          limit: pageSize,
          sortKey,
          sortDir,
        };
        this.adminOrderService.getOrders(params).subscribe((data) => {
          this.rows$.next(data.orders);
          this.total$.next(data.total);
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const isEdit = qp.get('edit') === 'true';

      if (!id) {
        this.selectedId$.next(null);
        this.detail$.next(null);
        this.editModel$.next(null);
        this.originalEditSnapshot = null;
        this.mode$.next('list');
        return;
      }

      this.selectedId$.next(id);
      this.adminOrderService.getOrderDetail(id).subscribe((data) => {
        const d = this.mapToDetailVM(data);
        this.detail$.next(d);

        if (isEdit) {
          const current = this.editModel$.value;
          const sameOrder = current?.order_id === d.order.order_id;

          if (!sameOrder) {
            const cloned: Partial<OrderEntity> = {
              order_id: d.order.order_id,
              admin_note: d.order.admin_note ?? '',
              updated_at: d.order.updated_at,
            };
            this.editModel$.next(cloned);
            this.originalEditSnapshot = JSON.stringify({
              admin_note: cloned.admin_note ?? '',
            });
          }

          this.mode$.next('edit');
        } else {
          this.editModel$.next(null);
          this.originalEditSnapshot = null;
          this.mode$.next('detail');
        }
      });
    });
  }

  private syncRoute(id: string | null, mode: Mode, push: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        id: id ?? null,
        edit: id && mode === 'edit' ? 'true' : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  stopEvent(ev: MouseEvent) {
    ev.stopPropagation();
    ev.preventDefault();
  }

  onChangeQ(v: string) {
    this.q = v;
    this.q$.next(v);
    this.page$.next(1);
  }

  onChangeStatus(v: '' | OrderStatus) {
    this.f_status = v;
    this.status$.next(v);
    this.page$.next(1);
  }

  onChangePayment(v: '' | PaymentStatus) {
    this.f_payment = v;
    this.payment$.next(v);
    this.page$.next(1);
  }

  onChangeRegion(v: string) {
    this.f_region = v;
    this.region$.next(v);
    this.page$.next(1);
  }

  onChangePageSize(v: number) {
    this.pageSize = Number(v) || 10;
    this.pageSize$.next(this.pageSize);
    this.page$.next(1);
  }

  resetFilters() {
    this.q = '';
    this.f_status = '';
    this.f_payment = '';
    this.f_region = '';
    this.pageSize = 10;

    this.q$.next('');
    this.status$.next('');
    this.payment$.next('');
    this.region$.next('');
    this.pageSize$.next(10);
    this.page$.next(1);
  }

  setPage(p: number) {
    this.page = p;
    this.page$.next(p);
  }

  toggleSort(key: SortKey) {
    const curKey = this.sortKey$.value;
    const curDir = this.sortDir$.value;

    if (curKey === key) {
      this.sortDir$.next(curDir === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortKey$.next(key);
    this.sortDir$.next('asc');
  }

  sortIcon(key: SortKey): string {
    const st = this.sortKey$.value;
    const dir = this.sortDir$.value;
    if (st !== key) return 'fa-sort';
    return dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  openDetail(orderId: string) {
    this.syncRoute(orderId, 'detail', true);
  }

  goList() {
    this.attemptLeave(() => {
      this.syncRoute(null, 'list', true);
    });
  }

  enterEdit() {
    const d = this.detail$.value;
    if (!d) return;
    this.syncRoute(d.order.order_id, 'edit', true);
  }

  backToDetail() {
    const id = this.selectedId$.value;
    if (!id) {
      this.goList();
      return;
    }

    this.attemptLeave(() => {
      this.syncRoute(id, 'detail', true);
    });
  }

  onHeaderBack() {
    if (this.mode$.value === 'edit') {
      this.backToDetail();
      return;
    }
    this.goList();
  }

  cancelEdit() {
    this.backToDetail();
  }

  get isDirty(): boolean {
    const em = this.editModel$.value;
    if (!em || !this.originalEditSnapshot) return false;

    const current = JSON.stringify({
      admin_note: em.admin_note ?? '',
    });
    return current !== this.originalEditSnapshot;
  }

  private attemptLeave(action: () => void) {
    if (!this.isDirty) {
      action();
      return;
    }
    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
  }

  onConfirmDiscard() {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.editModel$.next(null);
    this.originalEditSnapshot = null;
    action?.();
  }

  onCancelDiscard() {
    this.discardModalOpen = false;
    this.pendingDiscardAction = null;
  }

  saveEdit() {
    const em = this.editModel$.value;
    if (!em) return;

    const note = String(em.admin_note ?? '').trim();
    if (note.length > 500) return;

    this.saveModalOpen = true;
  }

  onCancelSave() {
    this.saveModalOpen = false;
  }

  executeSave() {
    const em = this.editModel$.value;
    const d = this.detail$.value;
    if (!em || !d) {
      this.saveModalOpen = false;
      return;
    }

    const note = String(em.admin_note ?? '').trim();

    this.adminOrderService.updateOrderNote(d.order.order_id, note).subscribe(() => {
      this.saveModalOpen = false;
      // Refresh detail
      this.adminOrderService.getOrderDetail(d.order.order_id).subscribe((data) => {
        this.detail$.next(this.mapToDetailVM(data));
        this.syncRoute(d.order.order_id, 'detail', true);
      });
    });
  }

  exportCsv(rows: VMListRow[]) {
    const headers = [
      'order_id',
      'order_number',
      'customer',
      'phone',
      'email',
      'region',
      'status',
      'payment_status',
      'created_at',
      'delivered_at',
      'total_amount',
    ];

    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.order_id,
          r.order_number,
          csvSafe(r.customer),
          r.phone,
          r.email,
          r.region,
          r.status,
          r.payment_status,
          r.created_at,
          r.delivered_at ?? '',
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

  confirmCancel(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId) return;
    if (!d.canCancel) return;

    this.cancelTargetOrderId = orderId;
    this.cancelModalOpen = true;
  }

  onCancelOrderDismiss() {
    this.cancelModalOpen = false;
    this.cancelTargetOrderId = null;
  }

  onConfirmCancelOrder() {
    const orderId = this.cancelTargetOrderId;
    if (!orderId) return;

    this.adminOrderService.updateOrderStatus(orderId, 'cancelled').subscribe(() => {
      this.cancelModalOpen = false;
      this.cancelTargetOrderId = null;
      this.adminOrderService.getOrderDetail(orderId).subscribe((data) => {
        this.detail$.next(this.mapToDetailVM(data));
        this.refreshList$.next();
        this.refreshStats$.next();
      });
    });
  }

  approveRequest(orderId: string) {
    // This part depends on backend implementation for requests. 
    // For now, let's just update order status as a demonstration of real signal.
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId) return;
    
    this.adminOrderService.updateOrderStatus(orderId, 'confirmed').subscribe(() => {
      this.adminOrderService.getOrderDetail(orderId).subscribe((data) => {
        this.detail$.next(this.mapToDetailVM(data));
        this.refreshList$.next();
      });
    });
  }

  markRequestCompleted(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId) return;

    this.adminOrderService.updateOrderStatus(orderId, 'delivered').subscribe(() => {
      this.adminOrderService.getOrderDetail(orderId).subscribe((data) => {
        this.detail$.next(this.mapToDetailVM(data));
        this.refreshList$.next();
      });
    });
  }

  private mapToDetailVM(data: any): OrderDetailVM {
    const { order, items, address, user } = data;
    
    const mappedItems = (items ?? []).map((it: any) => {
      const subtotal = it.unit_price * it.quantity;
      return {
        ...it,
        item_subtotal: subtotal,
        unitPriceText: money(it.unit_price),
        subtotalText: money(subtotal),
        product_image_url: it.product_image_url || 'https://via.placeholder.com/80x80.png?text=HomeBase'
      };
    });

    const createdAtText = this.fmtDate(order.createdAt);
    const deliveredAtText = order.delivered_at ? this.fmtDate(order.delivered_at) : '';

    const beforeTotalText = money(order.before_total);
    const discountTotalText = money(order.discount_total);
    const shippingFeeText = money(order.total_shipping_fee);
    const totalText = money(order.total_amount);

    const userFullName = user?.name || '—';
    const addressText = address
      ? `${address.name} • ${address.phone}\n${address.address_detail}, ${address.ward}, ${address.province}`
      : '—';

    const statusLabel = this.statusLabel(order.status);
    const statusPillClass = this.statusPillClass(order.status);
    const paymentLabel = this.paymentLabel(order.payment_status);
    const payPillClass = this.paymentPillClass(order.payment_status);

    const canCancel = order.status === 'pending' || order.status === 'confirmed' || order.status === 'packed';
    
    // Timeline mapping
    const timeline = this.buildTimeline(order, null);

    return {
      order: {
        ...order,
        order_id: order._id,
        subtotal_amount: order.before_total,
        discount_amount: order.discount_total,
        shipping_fee: order.total_shipping_fee,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      },
      user: user ? { ...user, user_id: user._id, full_name: user.name } : null,
      address: address ? { ...address, receiver_name: address.name, receiver_phone: address.phone, line1: address.address_detail, city: address.province } : null,
      items: mappedItems,
      userFullName,
      addressText,
      createdAtText,
      deliveredAtText,
      beforeTotalText,
      discountTotalText,
      shippingFeeText,
      totalText,
      statusLabel,
      statusPillClass,
      paymentLabel,
      payPillClass,
      canCancel,
      canApproveRequest: false, // Requests not implemented in backend yet
      canRejectRequest: false,
      canMarkCompleted: order.status === 'shipping',
      request: null,
      timeline,
    };
  }

  private buildRegions(rows: OrderListRow[]) {
    const set = new Set<string>();
    rows.forEach((r) => { if(r.region) set.add(r.region) });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  private fmtDate(iso: string) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return iso;
    }
  }

  private buildTimeline(order: any, request: any): TimelineItemVM[] {
    const steps: TimelineItemVM[] = [
      {
        key: 'created',
        title: 'Đặt hàng',
        desc: 'Đơn được tạo trên hệ thống.',
        atText: this.fmtDate(order.createdAt),
        done: true,
      },
      {
        key: 'confirmed',
        title: 'Xác nhận',
        desc: 'Đơn đã được xác nhận.',
        atText: order.status !== 'pending' ? this.fmtDate(order.updatedAt) : '—',
        done: order.status !== 'pending',
      },
      {
        key: 'delivered',
        title: 'Giao hàng',
        desc: 'Đã giao thành công.',
        atText: order.delivered_at ? this.fmtDate(order.delivered_at) : '—',
        done: order.status === 'delivered',
      }
    ];
    return steps;
  }

  statusLabel(s: OrderStatus) {
    switch (s) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed':
      case 'packed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã huỷ';
      case 'return_requested': return 'Y/c trả hàng';
      case 'returned': return 'Đã trả hàng';
      case 'exchange_requested': return 'Y/c đổi hàng';
      case 'exchanged': return 'Đã đổi hàng';
      case 'uncompleted': return 'Chưa hoàn tất';
      case 'completed': return 'Đã hoàn tất';
      default: return s;
    }
  }

  statusPillClass(s: OrderStatus) {
    switch (s) {
      case 'pending': return 'pill-pending';
      case 'confirmed':
      case 'packed': return 'pill-confirmed';
      case 'shipping': return 'pill-shipping';
      case 'delivered': return 'pill-delivered';
      case 'cancelled': return 'pill-cancelled';
      case 'return_requested': return 'pill-return-req';
      case 'returned': return 'pill-returned';
      case 'exchange_requested': return 'pill-exchange-req';
      case 'exchanged': return 'pill-confirmed';
      case 'uncompleted': return 'pill-pending';
      case 'completed': return 'pill-confirmed';
      default: return '';
    }
  }

  paymentLabel(p: PaymentStatus) {
    switch (p) {
      case 'unpaid': return 'Chưa thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'refunded': return 'Đã hoàn tiền';
      default: return p;
    }
  }

  paymentPillClass(p: PaymentStatus) {
    switch (p) {
      case 'unpaid': return 'pill-unpaid';
      case 'paid': return 'pill-paid';
      case 'refunded': return 'pill-refunded';
      default: return '';
    }
  }
}

/** ===================== PURE HELPERS ===================== */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function csvSafe(v: string) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function compareByKey(a: any, b: any, key: SortKey, dir: SortDir) {
  const va = a[key];
  const vb = b[key];

  let cmp = 0;
  if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
  else cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'vi', { numeric: true });

  return dir === 'asc' ? cmp : -cmp;
}

function money(v: number) {
  try {
    return new Intl.NumberFormat('vi-VN').format(v || 0) + ' ₫';
  } catch {
    return `${v || 0} ₫`;
  }
}
