import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';

/** ===================== TYPES ===================== */
type Mode = 'list' | 'detail' | 'edit';

type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'exchange_requested'
  | 'exchanged';

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
}

interface OrderDetailRaw {
  order: OrderEntity;
  user: UserEntity | null;
  address: AddressEntity | null;
  items: OrderItemEntity[];
  request: ReturnExchangeRequestEntity | null;
}

/** ===================== MOCK DATA ===================== */
const MOCK = buildOrdersMock(22);
const MOCK_ROWS: OrderListRow[] = MOCK.MOCK_ROWS;
const MOCK_DETAIL: Record<string, OrderDetailRaw> = MOCK.MOCK_DETAIL;

@Component({
  selector: 'app-management-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management-orders.html',
  styleUrls: ['./management-orders.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementOrders implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  private rows$ = new BehaviorSubject<OrderListRow[]>(MOCK_ROWS);

  private mode$ = new BehaviorSubject<Mode>('list');
  private selectedId$ = new BehaviorSubject<string | null>(null);
  private detail$ = new BehaviorSubject<OrderDetailVM | null>(null);
  private editModel$ = new BehaviorSubject<Partial<OrderEntity> | null>(null);

  // Filters (bind in template)
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

  vm$ = combineLatest([
    this.mode$,
    this.selectedId$,
    this.detail$,
    this.editModel$,
    this.rows$,
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

        const computedRows: VMListRow[] = rows.map((r) => ({
          ...r,
          createdAtText: this.fmtDate(r.created_at),
          totalText: money(r.total_amount),
          statusLabel: this.statusLabel(r.status),
          statusPillClass: this.statusPillClass(r.status),
          paymentLabel: this.paymentLabel(r.payment_status),
          payPillClass: this.paymentPillClass(r.payment_status),
        }));

        const key = q.trim().toLowerCase();
        let filtered = computedRows.filter((r) => {
          if (key) {
            const hit =
              r.order_number.toLowerCase().includes(key) ||
              r.customer.toLowerCase().includes(key) ||
              r.phone.toLowerCase().includes(key) ||
              r.region.toLowerCase().includes(key);
            if (!hit) return false;
          }
          if (status && r.status !== status) return false;
          if (payment && r.payment_status !== payment) return false;
          if (region && r.region !== region) return false;
          return true;
        });

        filtered = filtered.sort((a, b) => compareByKey(a, b, sortKey, sortDir));
        const exportRows = filtered.slice();

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = clamp(page, 1, totalPages);
        const start = (safePage - 1) * pageSize;
        const paged = filtered.slice(start, start + pageSize);

        const showingFrom = total === 0 ? 0 : start + 1;
        const showingTo = total === 0 ? 0 : Math.min(total, start + paged.length);

        const vm: VM = {
          mode,
          rows: paged,
          exportRows,
          total,
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
        };
        return vm;
      },
    ),
  );

  ngOnInit(): void {
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================== ROUTE SYNC (giống Products: dùng query params) ==================
  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const modeRaw = qp.get('mode');

      const incomingId = id ? String(id) : null;
      const incomingMode: Mode = incomingId ? (modeRaw === 'edit' ? 'edit' : 'detail') : 'list';

      if (!incomingId) {
        this.selectedId$.next(null);
        this.detail$.next(null);
        this.editModel$.next(null);
        this.mode$.next('list');
        return;
      }

      const d = this.buildDetail(incomingId);
      if (!d) {
        // id không tồn tại -> clear query
        this.syncRoute(null, 'list', false);
        return;
      }

      this.selectedId$.next(incomingId);
      this.detail$.next(d);

      if (incomingMode === 'edit') {
        const cloned: Partial<OrderEntity> = {
          order_id: d.order.order_id,
          admin_note: d.order.admin_note ?? '',
          note: d.order.note ?? '',
          updated_at: d.order.updated_at,
        };
        this.editModel$.next(cloned);
        this.mode$.next('edit');
      } else {
        this.editModel$.next(null);
        this.mode$.next('detail');
      }
    });
  }

  private syncRoute(id: string | null, mode: Mode, push: boolean): void {
    const queryParams: Record<string, string | null> = {
      id: id ? id : null,
      mode: id ? (mode === 'edit' ? 'edit' : 'detail') : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  /** ===================== TEMPLATE HELPERS ===================== */
  stopEvent(ev: MouseEvent) {
    ev.stopPropagation();
    ev.preventDefault();
  }

  /** ===================== FILTERS / SORT / PAGING ===================== */
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
    this.pageSize = v;
    this.pageSize$.next(v);
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

  /** ===================== ROUTER NAV ACTIONS ===================== */
  openDetail(orderId: string) {
    this.syncRoute(orderId, 'detail', true);
  }

  goList() {
    this.syncRoute(null, 'list', true);
  }

  enterEdit() {
    const d = this.detail$.value;
    if (!d) return;
    this.syncRoute(d.order.order_id, 'edit', true);
  }

  cancelEdit() {
    const id = this.selectedId$.value;
    if (!id) return;
    this.syncRoute(id, 'detail', true);
  }

  saveEdit() {
    const em = this.editModel$.value;
    const d = this.detail$.value;
    if (!em || !d) return;

    const note = (em.admin_note ?? '').trim();
    if (note.length > 500) {
      alert('Ghi chú nội bộ tối đa 500 ký tự.');
      return;
    }

    updateMockOrder(d.order.order_id, {
      admin_note: note,
      updated_at: new Date().toISOString(),
    });

    // quay về detail theo URL
    this.syncRoute(d.order.order_id, 'detail', true);
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

  /** ===================== BUSINESS ACTIONS ===================== */
  confirmCancel(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId) return;

    const canCancel = d.order.status === 'pending' || d.order.status === 'packed';
    if (!canCancel) {
      alert('Chỉ huỷ được khi đơn ở trạng thái: Chờ xác nhận / Đã xác nhận.');
      return;
    }

    const ok = window.confirm(`Xác nhận HUỶ đơn ${d.order.order_number}?`);
    if (!ok) return;

    const reason = (window.prompt('Nhập lý do huỷ (bắt buộc):') ?? '').trim();
    if (!reason) {
      alert('Cần nhập lý do huỷ.');
      return;
    }

    updateMockOrder(orderId, {
      status: 'cancelled',
      cancel_reason: reason,
      updated_at: new Date().toISOString(),
    });

    // rebuild detail
    this.detail$.next(this.buildDetail(orderId));
  }

  approveRequest(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId || !d.request) return;

    if (!d.request.isWithin7Days) {
      alert('Yêu cầu đã quá 7 ngày. Không thể duyệt theo rule mặc định.');
      return;
    }
    if (d.request.status !== 'requested') return;

    const ok = window.confirm('Duyệt yêu cầu này?');
    if (!ok) return;

    updateMockRequest(orderId, { status: 'approved', updated_at: new Date().toISOString() });

    const nextStatus: OrderStatus =
      d.request.type === 'return' ? 'return_requested' : 'exchange_requested';
    updateMockOrder(orderId, { status: nextStatus, updated_at: new Date().toISOString() });

    this.detail$.next(this.buildDetail(orderId));
  }

  rejectRequest(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId || !d.request) return;
    if (d.request.status !== 'requested') return;

    const ok = window.confirm('Từ chối yêu cầu này?');
    if (!ok) return;

    const note = (window.prompt('Nhập lý do từ chối (tuỳ chọn):') ?? '').trim();

    updateMockRequest(orderId, {
      status: 'rejected',
      note: note || d.request.note,
      updated_at: new Date().toISOString(),
    });

    this.detail$.next(this.buildDetail(orderId));
  }

  markRequestCompleted(orderId: string) {
    const d = this.detail$.value;
    if (!d || d.order.order_id !== orderId || !d.request) return;
    if (d.request.status !== 'approved') {
      alert('Chỉ hoàn tất khi yêu cầu đã được duyệt.');
      return;
    }

    const ok = window.confirm('Xác nhận đã xử lý xong đổi/trả?');
    if (!ok) return;

    updateMockRequest(orderId, { status: 'completed', updated_at: new Date().toISOString() });

    const nextStatus: OrderStatus = d.request.type === 'return' ? 'returned' : 'exchanged';
    updateMockOrder(orderId, { status: nextStatus, updated_at: new Date().toISOString() });

    this.detail$.next(this.buildDetail(orderId));
  }

  /** ===================== VIEWMODEL BUILDER ===================== */
  private buildDetail(orderId: string): OrderDetailVM | null {
    const raw: OrderDetailRaw | undefined = MOCK_DETAIL[orderId];
    if (!raw) return null;

    const order = raw.order;

    const items = (raw.items ?? []).map((it: OrderItemEntity) => {
      const subtotal = it.unit_price * it.quantity;
      return {
        ...it,
        item_subtotal: subtotal,
        unitPriceText: money(it.unit_price),
        subtotalText: money(subtotal),
      };
    });

    const user = raw.user ?? null;
    const address = raw.address ?? null;

    const createdAtText = this.fmtDate(order.created_at);
    const deliveredAtText = order.delivered_at ? this.fmtDate(order.delivered_at) : '';

    const requestRaw = raw.request ?? null;
    const isWithin7Days = this.isWithin7Days(order.delivered_at, requestRaw?.created_at);
    const request = requestRaw
      ? {
          ...requestRaw,
          createdAtText: this.fmtDate(requestRaw.created_at),
          isWithin7Days,
        }
      : null;

    const beforeTotalText = money(order.subtotal_amount);
    const discountTotalText = money(order.discount_amount);
    const shippingFeeText = money(order.shipping_fee);
    const totalText = money(order.total_amount);

    const userFullName = user?.full_name || '—';
    const addressText = address
      ? `${address.receiver_name} • ${address.receiver_phone}\n${address.line1}, ${address.ward}, ${address.district}, ${address.city}`
      : '—';

    const statusLabel = this.statusLabel(order.status);
    const statusPillClass = this.statusPillClass(order.status);
    const paymentLabel = this.paymentLabel(order.payment_status);
    const payPillClass = this.paymentPillClass(order.payment_status);

    const canCancel = order.status === 'pending' || order.status === 'packed';
    const canApproveRequest = !!request && request.status === 'requested' && request.isWithin7Days;
    const canRejectRequest = !!request && request.status === 'requested';
    const canMarkCompleted = !!request && request.status === 'approved';

    const timeline = this.buildTimeline(order, request);

    return {
      order,
      user,
      address,
      items,
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
      canApproveRequest,
      canRejectRequest,
      canMarkCompleted,
      request,
      timeline,
    };
  }

  private buildRegions(rows: OrderListRow[]) {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.region));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  private fmtDate(iso: string) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch {
      return iso;
    }
  }

  private isWithin7Days(deliveredAt: string | null, requestAt?: string) {
    if (!deliveredAt || !requestAt) return true;
    const a = new Date(deliveredAt).getTime();
    const b = new Date(requestAt).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return true;
    const diffDays = Math.floor((b - a) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  private buildTimeline(
    order: OrderEntity,
    request:
      | (ReturnExchangeRequestEntity & { createdAtText: string; isWithin7Days: boolean })
      | null,
  ): TimelineItemVM[] {
    const steps: Array<{
      key: string;
      title: string;
      desc: string;
      at: string | null;
      done: boolean;
    }> = [
      {
        key: 'created',
        title: 'Đặt hàng',
        desc: 'Đơn được tạo trên hệ thống.',
        at: order.created_at,
        done: true,
      },
      {
        key: 'packed',
        title: 'Xác nhận',
        desc: 'Đơn được xác nhận / chuẩn bị.',
        at: order.status !== 'pending' ? order.updated_at : null,
        done: order.status !== 'pending',
      },
      {
        key: 'delivered',
        title: 'Hoàn tất giao',
        desc: 'Giao thành công.',
        at: order.delivered_at,
        done:
          order.status === 'delivered' ||
          order.status === 'returned' ||
          order.status === 'exchanged',
      },
      {
        key: 'cancelled',
        title: 'Huỷ',
        desc: order.cancel_reason ? `Lý do: ${order.cancel_reason}` : 'Đơn bị huỷ.',
        at: order.status === 'cancelled' ? order.updated_at : null,
        done: order.status === 'cancelled',
      },
    ];

    if (request) {
      steps.push({
        key: 'req',
        title: request.type === 'return' ? 'Yêu cầu trả hàng' : 'Yêu cầu đổi hàng',
        desc: request.reason || request.note || '—',
        at: request.created_at,
        done: true,
      });

      steps.push({
        key: 'req_done',
        title: 'Xử lý đổi/trả',
        desc: request.status === 'completed' ? 'Đã hoàn tất.' : `Trạng thái: ${request.status}`,
        at: request.updated_at,
        done: request.status === 'completed',
      });
    }

    return steps.map((s) => ({
      key: s.key,
      title: s.title,
      desc: s.desc,
      atText: s.at ? this.fmtDate(s.at) : '—',
      done: s.done,
    }));
  }

  /** ===================== LABELS / CLASSES ===================== */
  statusLabel(s: OrderStatus) {
    switch (s) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'packed':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã huỷ';
      case 'return_requested':
        return 'Y/c trả hàng';
      case 'returned':
        return 'Đã trả hàng';
      case 'exchange_requested':
        return 'Y/c đổi hàng';
      case 'exchanged':
        return 'Đã đổi hàng';
      default:
        return s;
    }
  }

  statusPillClass(s: OrderStatus) {
    switch (s) {
      case 'pending':
        return 'pill-pending';
      case 'packed':
        return 'pill-packed';
      case 'shipping':
        return 'pill-shipping';
      case 'delivered':
        return 'pill-delivered';
      case 'cancelled':
        return 'pill-cancelled';
      case 'return_requested':
      case 'exchange_requested':
        return 'pill-warn';
      case 'returned':
      case 'exchanged':
        return 'pill-info';
      default:
        return '';
    }
  }

  paymentLabel(p: PaymentStatus) {
    switch (p) {
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return p;
    }
  }

  paymentPillClass(p: PaymentStatus) {
    switch (p) {
      case 'unpaid':
        return 'pill-unpaid';
      case 'paid':
        return 'pill-paid';
      case 'refunded':
        return 'pill-refunded';
      default:
        return '';
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
    return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
  } catch {
    return `${v} ₫`;
  }
}

/** ===================== MOCK STORE MUTATORS ===================== */
function updateMockOrder(orderId: string, patch: Partial<OrderEntity>) {
  const store = MOCK_DETAIL[orderId];
  if (!store) return;
  store.order = { ...store.order, ...patch };
}

function updateMockRequest(orderId: string, patch: Partial<ReturnExchangeRequestEntity>) {
  const store = MOCK_DETAIL[orderId];
  if (!store?.request) return;
  store.request = { ...store.request, ...patch };
}

/** ===================== MOCK GENERATOR (STRICT TYPED) ===================== */
function buildOrdersMock(count: number): {
  MOCK_ROWS: OrderListRow[];
  MOCK_DETAIL: Record<string, OrderDetailRaw>;
} {
  const regions = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];
  const customers: Array<Pick<UserEntity, 'full_name' | 'phone' | 'email'> & { user_id: string }> =
    [
      { user_id: 'U_01', full_name: 'Nguyễn Văn A', phone: '0909 111 222', email: 'a@gmail.com' },
      { user_id: 'U_02', full_name: 'Trần Thị B', phone: '0933 222 333', email: 'b@gmail.com' },
      { user_id: 'U_03', full_name: 'Lê Văn C', phone: '0912 888 999', email: 'c@gmail.com' },
      { user_id: 'U_04', full_name: 'Phạm Thị D', phone: '0901 222 111', email: 'd@gmail.com' },
      { user_id: 'U_05', full_name: 'Hoàng Văn E', phone: '0988 456 123', email: 'e@gmail.com' },
      { user_id: 'U_06', full_name: 'Vũ Thị F', phone: '0977 333 999', email: 'f@gmail.com' },
      { user_id: 'U_07', full_name: 'Đặng Văn G', phone: '0966 222 888', email: 'g@gmail.com' },
      { user_id: 'U_08', full_name: 'Bùi Thị H', phone: '0911 444 555', email: 'h@gmail.com' },
    ];

  const productSeeds = [
    { product_id: 'P_01', product_name: 'Sofa vải 2 chỗ', product_variant_id: 'V_01' },
    { product_id: 'P_02', product_name: 'Bàn trà gỗ sồi', product_variant_id: 'V_02' },
    { product_id: 'P_03', product_name: 'Giường ngủ 1m8', product_variant_id: 'V_03' },
    { product_id: 'P_04', product_name: 'Tủ quần áo 3 cánh', product_variant_id: 'V_04' },
    { product_id: 'P_05', product_name: 'Kệ tivi tối giản', product_variant_id: 'V_05' },
  ];

  const statuses: OrderStatus[] = [
    'pending',
    'packed',
    'shipping',
    'delivered',
    'cancelled',
    'return_requested',
    'returned',
    'exchange_requested',
    'exchanged',
  ];

  const payments: PaymentStatus[] = ['unpaid', 'paid', 'refunded'];

  const MOCK_ROWS: OrderListRow[] = [];
  const MOCK_DETAIL: Record<string, OrderDetailRaw> = {};

  for (let i = 1; i <= count; i++) {
    const order_id = `OD_${String(i).padStart(3, '0')}`;
    const order_number = `HB${new Date().getFullYear()}${String(10000 + i)}`;

    const customer = customers[(i - 1) % customers.length];
    const region = regions[(i - 1) % regions.length];

    const createdAt = new Date(Date.now() - i * 36 * 60 * 60 * 1000); // -36h each
    const created_at = createdAt.toISOString();

    const status = statuses[i % statuses.length];
    const payment_status = payments[i % payments.length];

    const delivered_at =
      status === 'delivered' || status === 'returned' || status === 'exchanged'
        ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const subtotal_amount = 900000 + i * 65000;
    const discount_amount = i % 3 === 0 ? 50000 : 0;
    const shipping_fee = 30000;
    const total_amount = subtotal_amount - discount_amount + shipping_fee;

    const order: OrderEntity = {
      order_id,
      order_number,
      user_id: customer.user_id,
      status,
      payment_status,
      region,
      shipping_fee,
      subtotal_amount,
      discount_amount,
      total_amount,
      note: i % 4 === 0 ? 'Giao giờ hành chính' : '',
      admin_note: i % 5 === 0 ? 'Ưu tiên xử lý' : '',
      cancel_reason: status === 'cancelled' ? 'Khách đổi ý' : '',
      created_at,
      delivered_at,
      updated_at: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    };

    const user: UserEntity = {
      user_id: customer.user_id,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
    };

    const address: AddressEntity = {
      receiver_name: customer.full_name,
      receiver_phone: customer.phone,
      line1: `Số ${10 + i}, Đường ABC`,
      ward: `Phường ${((i - 1) % 12) + 1}`,
      district: `Quận ${((i - 1) % 10) + 1}`,
      city: region,
    };

    const itemsCount = (i % 3) + 1;
    const items: OrderItemEntity[] = Array.from({ length: itemsCount }).map((_, idx) => {
      const seed = productSeeds[(i + idx) % productSeeds.length];
      const unit_price = 250000 + ((i + idx) % 7) * 120000;
      const quantity = ((i + idx) % 3) + 1;

      return {
        order_item_id: `OI_${order_id}_${idx + 1}`,
        order_id,
        product_id: seed.product_id,
        product_name: seed.product_name,
        product_image_url: 'https://via.placeholder.com/80x80.png?text=HomeBase',
        product_variant_id: seed.product_variant_id,
        unit_price,
        quantity,
        created_at,
        updated_at: order.updated_at,
      };
    });

    let request: ReturnExchangeRequestEntity | null = null;
    if (status === 'return_requested' || status === 'returned') {
      const reqAt = delivered_at
        ? new Date(new Date(delivered_at).getTime() + 2 * 24 * 60 * 60 * 1000)
        : new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      request = {
        request_id: `RQ_${order_id}`,
        order_id,
        type: 'return',
        reason: 'Sản phẩm không đúng mô tả',
        note: '',
        status: status === 'returned' ? 'completed' : 'requested',
        created_at: reqAt.toISOString(),
        updated_at: reqAt.toISOString(),
      };
    } else if (status === 'exchange_requested' || status === 'exchanged') {
      const reqAt = delivered_at
        ? new Date(new Date(delivered_at).getTime() + 1 * 24 * 60 * 60 * 1000)
        : new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
      request = {
        request_id: `RQ_${order_id}`,
        order_id,
        type: 'exchange',
        reason: 'Đổi màu / kích thước',
        note: '',
        status: status === 'exchanged' ? 'completed' : 'requested',
        created_at: reqAt.toISOString(),
        updated_at: reqAt.toISOString(),
      };
    }

    const row: OrderListRow = {
      order_id,
      order_number,
      status,
      payment_status,
      region,
      created_at,
      delivered_at,
      total_amount,
      customer: customer.full_name,
      phone: customer.phone,
      email: customer.email,
    };

    MOCK_ROWS.push(row);
    MOCK_DETAIL[order_id] = {
      order,
      user,
      address,
      items,
      request,
    };
  }

  return { MOCK_ROWS, MOCK_DETAIL };
}
