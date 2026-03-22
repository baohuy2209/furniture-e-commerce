import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

/** ===== Types (scope đúng FDD khách hàng) ===== */
type USER_STATUS = 'active' | 'locked';

type ORDER_STATUS =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'refunded';

type PAYMENT_STATUS = 'unpaid' | 'paid' | 'refunded' | 'failed';

export type USER = {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: USER_STATUS;
  created_at: string;
  updated_at: string;
  last_login?: string;
};

export type ORDER = {
  order_id: string;
  user_id: string;
  order_number: string;
  status: ORDER_STATUS;
  total_amount: number;
  payment_status: PAYMENT_STATUS;
  created_at: string;
};

export type POINT_RULE = {
  id: string;
  earn_rate: number; // 0.01 => 1%
  redeem_rate: number; // 1 point = ?đ
  max_redeem_percent: number; // 0.2 => 20%
  updated_at: string;
};

export type POINT_TXN = {
  id: string;
  user_id: string;
  type: 'earn' | 'redeem' | 'adjust';
  points: number;
  note: string;
  created_at: string;
};

export type VOUCHER = {
  voucher_id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  min_order_value: number;
  start_at: string;
  end_at: string;
  status: 'active' | 'expired' | 'paused';
};

export type VOUCHER_USAGE = {
  id: string;
  voucher_id: string;
  user_id: string;
  order_number: string;
  discount_amount: number;
  used_at: string;
};

type MODE = 'list' | 'detail';
type DETAIL_TAB = 'overview' | 'voucher_points' | 'orders' | 'reports';

type SortKey = 'name' | 'created_at' | 'last_login' | 'orders' | 'spent' | 'status';
type SortDir = 'asc' | 'desc';

type CustomerRowVM = {
  user: USER;
  display_name: string;
  initials: string;
  orders_count: number;
  total_spent: number;
  points_balance: number;
  voucher_active_count: number;
  rank: string;
  rankClass: string;
  stt: number;
};

type ListVM = {
  mode: MODE;
  q: string;
  status: 'all' | USER_STATUS;
  sortKey: SortKey;
  sortDir: SortDir;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  items: Array<CustomerRowVM>;
  summary?: {
    totalCustomers: number;
    newThisMonth: number;
    lockedCount: number;
  };
};

type VoucherEffectVM = {
  voucher_id: string;
  code: string;
  title: string;
  used_count: number;
  total_discount: number;
};

type DetailVM = {
  mode: MODE;
  tab: DETAIL_TAB;

  user: USER;
  display_name: string;
  initials: string;

  orders_count: number;
  total_spent: number;

  points_balance: number;

  /** FIX: tính sẵn, tránh arrow function trong template */
  active_voucher_count: number;

  point_rule: POINT_RULE;
  point_history: POINT_TXN[];

  vouchers: VOUCHER[];
  voucher_effect: VoucherEffectVM[];

  orders: ORDER[];
};

@Component({
  selector: 'app-management-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './management-customers.html',
  styleUrls: ['./management-customers.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementCustomers {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** ===== mock store (sau nối API) ===== */
  private readonly users$ = new BehaviorSubject<USER[]>(seedUsers());
  private readonly orders$ = new BehaviorSubject<ORDER[]>(seedOrders());
  private readonly pointRule$ = new BehaviorSubject<POINT_RULE>(seedPointRule());
  private readonly pointTxns$ = new BehaviorSubject<POINT_TXN[]>(seedPointTxns());
  private readonly vouchers$ = new BehaviorSubject<VOUCHER[]>(seedVouchers());
  private readonly voucherUsage$ = new BehaviorSubject<VOUCHER_USAGE[]>(seedVoucherUsage());

  /** ===== list state ===== */
  private readonly q$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<'all' | USER_STATUS>('all');
  private readonly sort$ = new BehaviorSubject<{ key: SortKey; dir: SortDir }>({
    key: 'created_at',
    dir: 'desc',
  });
  private readonly page$ = new BehaviorSubject<number>(1);
  private readonly pageSize$ = new BehaviorSubject<number>(10);

  /** ===== detail tab local ===== */
  private readonly detailTab$ = new BehaviorSubject<DETAIL_TAB>('overview');

  /** ===== cancel order modal ===== */
  isCancelModalOpen = false;
  cancelOrderId: string | null = null;
  cancelOrderNumber = '';

  /** ===== route state ===== */
  readonly routeState$ = this.route.queryParamMap.pipe(
    map((qp) => {
      const mode = (qp.get('mode') as MODE) || 'list';
      const id = qp.get('id') || '';
      const tab = (qp.get('tab') as DETAIL_TAB) || 'overview';
      return { mode, id, tab };
    }),
  );

  /** ===== rows ===== */
  private readonly customerRows$ = combineLatest([
    this.users$,
    this.orders$,
    this.pointTxns$,
    this.vouchers$,
  ]).pipe(
    map(([users, orders, txns, vouchers]) => {
      const ordersByUser = groupBy(orders, (o) => o.user_id);
      const txnsByUser = groupBy(txns, (t) => t.user_id);

      return users.map((u) => {
        const display_name = `${u.last_name} ${u.first_name}`.trim();
        const initials = getInitials(display_name);

        const os = ordersByUser.get(u.user_id) || [];
        const orders_count = os.length;
        const total_spent = os.reduce((sum, it) => sum + (it.total_amount || 0), 0);

        const ts = txnsByUser.get(u.user_id) || [];
        const points_balance = ts.reduce((sum, it) => sum + (it.points || 0), 0);

        const voucher_active_count = vouchers.filter((v) => v.status === 'active').length;

        let rank = 'Đồng';
        let rankClass = 'rank-bronze';
        if (total_spent >= 30000000) { rank = 'Kim cương'; rankClass = 'rank-diamond'; }
        else if (total_spent >= 15000000) { rank = 'Vàng'; rankClass = 'rank-gold'; }
        else if (total_spent >= 5000000) { rank = 'Bạc'; rankClass = 'rank-silver'; }

        return {
          user: u,
          display_name,
          initials,
          orders_count,
          total_spent,
          points_balance,
          voucher_active_count,
          rank,
          rankClass,
          stt: 0,
        } as CustomerRowVM;
      });
    }),
  );

  /** ===== List VM ===== */
  readonly listVm$ = combineLatest([
    this.routeState$,
    this.customerRows$,
    this.q$,
    this.status$,
    this.sort$,
    this.page$,
    this.pageSize$,
  ]).pipe(
    map(([rs, rows, q, status, sort, page, pageSize]) => {
      if (rs.mode !== 'list') {
        return {
          mode: rs.mode,
          q,
          status,
          sortKey: sort.key,
          sortDir: sort.dir,
          total: 0,
          page,
          pageSize,
          pageCount: 1,
          items: [],
          summary: { totalCustomers: 0, newThisMonth: 0, lockedCount: 0 }
        } as ListVM;
      }

      const qNorm = (q || '').trim().toLowerCase();

      // Summary
      let newThisMonth = 0;
      let lockedCount = 0;
      
      const now = new Date();
      // First day of current month in ISO format
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const firstDayThisMonth = `${currentYear}-${currentMonth}-01T00:00:00.000Z`;

      rows.forEach(r => {
        if (r.user.status === 'locked') lockedCount++;
        if (r.user.created_at >= firstDayThisMonth) newThisMonth++;
      });

      const summary = {
        totalCustomers: rows.length,
        newThisMonth,
        lockedCount
      };

      let filtered = rows.filter((r) => {
        const u = r.user;

        const matchQ =
          !qNorm ||
          r.display_name.toLowerCase().includes(qNorm) ||
          u.user_id.toLowerCase().includes(qNorm) ||
          u.email.toLowerCase().includes(qNorm) ||
          u.phone.toLowerCase().includes(qNorm);

        const matchStatus = status === 'all' ? true : u.status === status;

        return matchQ && matchStatus;
      });

      filtered = filtered.sort((a, b) => this.compareRows(a, b, sort.key, sort.dir));

      const total = filtered.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.max(1, Math.min(page, pageCount));
      const start = (safePage - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map((r, i) => ({
        ...r,
        stt: start + i + 1,
      }));

      return {
        mode: 'list',
        q,
        status,
        sortKey: sort.key,
        sortDir: sort.dir,
        total,
        page: safePage,
        pageSize,
        pageCount,
        items,
        summary
      } as ListVM;
    }),
  );

  /** ===== Detail VM ===== */
  readonly detailVm$ = combineLatest([
    this.routeState$,
    this.detailTab$,
    this.users$,
    this.orders$,
    this.pointRule$,
    this.pointTxns$,
    this.vouchers$,
    this.voucherUsage$,
  ]).pipe(
    map(([rs, tabLocal, users, orders, pointRule, txns, vouchers, usage]) => {
      if (rs.mode !== 'detail') return null;

      const user = users.find((u) => u.user_id === rs.id);
      if (!user) return null;

      const tab = rs.tab || tabLocal || 'overview';

      const display_name = `${user.last_name} ${user.first_name}`.trim();
      const initials = getInitials(display_name);

      const userOrders = orders
        .filter((o) => o.user_id === user.user_id)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      const orders_count = userOrders.length;
      const total_spent = userOrders.reduce((sum, it) => sum + (it.total_amount || 0), 0);

      const userTxns = txns
        .filter((t) => t.user_id === user.user_id)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      const points_balance = userTxns.reduce((sum, it) => sum + (it.points || 0), 0);

      const active_voucher_count = vouchers.filter((v) => v.status === 'active').length;

      const usageByVoucher = groupBy(usage, (u) => u.voucher_id);
      const voucher_effect: VoucherEffectVM[] = vouchers.map((v) => {
        const uRows = usageByVoucher.get(v.voucher_id) || [];
        return {
          voucher_id: v.voucher_id,
          code: v.code,
          title: v.title,
          used_count: uRows.length,
          total_discount: uRows.reduce((s, it) => s + (it.discount_amount || 0), 0),
        };
      });

      return {
        mode: 'detail',
        tab,

        user,
        display_name,
        initials,

        orders_count,
        total_spent,

        points_balance,
        active_voucher_count,

        point_rule: pointRule,
        point_history: userTxns,

        vouchers,
        voucher_effect: voucher_effect.sort((a, b) => b.used_count - a.used_count).slice(0, 8),

        orders: userOrders,
      } as DetailVM;
    }),
  );

  /** ===== UI handlers ===== */
  onSearchChange(v: string) {
    this.q$.next(v ?? '');
    this.page$.next(1);
  }

  setStatus(v: 'all' | USER_STATUS) {
    this.status$.next(v);
    this.page$.next(1);
  }

  resetFilters() {
    this.q$.next('');
    this.status$.next('all');
    this.sort$.next({ key: 'created_at', dir: 'desc' });
    this.page$.next(1);
    this.pageSize$.next(10);
  }

  toggleSort(key: SortKey) {
    const cur = this.sort$.value;
    if (cur.key === key) {
      this.sort$.next({ key, dir: cur.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.sort$.next({ key, dir: 'asc' });
    }
  }

  sortIcon(key: SortKey): string {
    const cur = this.sort$.value;
    if (cur.key !== key) return 'fa-sort';
    return cur.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

  setPage(p: number) {
    this.page$.next(p);
  }

  setPageSize(n: number) {
    this.pageSize$.next(Number(n));
    this.page$.next(1);
  }

  openDetail(user_id: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'detail', id: user_id, tab: 'overview' },
      queryParamsHandling: 'merge',
    });
  }

  backToList() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'list', id: null, tab: null },
      queryParamsHandling: 'merge',
    });
  }

  setDetailTab(tab: DETAIL_TAB) {
    this.detailTab$.next(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  /** ===== FDD: Tạm khóa/Mở khóa ===== */
  toggleLock(user_id: string) {
    const users = this.users$.value;
    const idx = users.findIndex((u) => u.user_id === user_id);
    if (idx < 0) return;

    const u = users[idx];
    const nextStatus: USER_STATUS = u.status === 'locked' ? 'active' : 'locked';

    const next = users.map((it) =>
      it.user_id === user_id ? { ...it, status: nextStatus, updated_at: nowIso() } : it,
    );
    this.users$.next(next);
  }

  /** ===== Cancel Order ===== */
  initCancelOrder(order_id: string, order_number: string) {
    this.cancelOrderId = order_id;
    this.cancelOrderNumber = order_number;
    this.isCancelModalOpen = true;
  }

  confirmCancelOrder() {
    if (!this.cancelOrderId) return;
    
    const orders = this.orders$.value;
    const next = orders.map(o => 
      o.order_id === this.cancelOrderId ? { ...o, status: 'cancelled' as ORDER_STATUS } : o
    );
    
    this.orders$.next(next);
    this.closeCancelModal();
  }

  closeCancelModal() {
    this.isCancelModalOpen = false;
    this.cancelOrderId = null;
    this.cancelOrderNumber = '';
  }

  /** ===== Export CSV ===== */
  exportCustomersCsv(vm: ListVM) {
    const rows = (vm?.items || []).map((r) => {
      const u = r.user;
      return {
        user_id: u.user_id,
        username: u.username,
        full_name: `${u.last_name} ${u.first_name}`.trim(),
        email: u.email,
        phone: u.phone,
        status: u.status,
        orders_count: r.orders_count,
        total_spent: r.total_spent,
        points_balance: r.points_balance,
        created_at: u.created_at,
        last_login: u.last_login || '',
      };
    });

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /** ===== template helpers ===== */
  formatMoney(v: number) {
    return (v || 0).toLocaleString('vi-VN') + 'đ';
  }

  statusLabel(s: USER_STATUS) {
    return s === 'active' ? 'Hoạt động' : 'Tạm khóa';
  }

  orderStatusLabel(s: ORDER_STATUS) {
    const m: Record<ORDER_STATUS, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Hoàn tiền',
    };
    return m[s] || s;
  }

  payStatusLabel(s: PAYMENT_STATUS) {
    const m: Record<PAYMENT_STATUS, string> = {
      unpaid: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      refunded: 'Hoàn tiền',
      failed: 'Thất bại',
    };
    return m[s] || s;
  }

  orderStatusPillClass(s: ORDER_STATUS) {
    const m: Record<ORDER_STATUS, string> = {
      pending: 'pill-pending',
      confirmed: 'pill-confirmed',
      processing: 'pill-confirmed',
      shipping: 'pill-shipping',
      completed: 'pill-ok',
      cancelled: 'pill-cancelled',
      refunded: 'pill-refunded',
    };
    return m[s] || '';
  }

  payStatusPillClass(s: PAYMENT_STATUS) {
    const m: Record<PAYMENT_STATUS, string> = {
      unpaid: 'pill-unpaid',
      paid: 'pill-paid',
      refunded: 'pill-refunded',
      failed: 'pill-cancelled',
    };
    return m[s] || '';
  }

  private compareRows(a: CustomerRowVM, b: CustomerRowVM, key: SortKey, dir: SortDir) {
    const m = dir === 'asc' ? 1 : -1;
    const av = this.getSortValue(a, key);
    const bv = this.getSortValue(b, key);

    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * m;
    return String(av).localeCompare(String(bv)) * m;
  }

  private getSortValue(r: CustomerRowVM, key: SortKey) {
    switch (key) {
      case 'name':
        return r.display_name.toLowerCase();
      case 'created_at':
        return +new Date(r.user.created_at);
      case 'last_login':
        return r.user.last_login ? +new Date(r.user.last_login) : 0;
      case 'orders':
        return r.orders_count;
      case 'spent':
        return r.total_spent;
      case 'status':
        return r.user.status === 'active' ? 1 : 0;
    }
  }
}

/** ===== helpers / mock seed ===== */
function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
  const map = new Map<string, T[]>();
  for (const it of arr) {
    const k = keyFn(it);
    map.set(k, [...(map.get(k) || []), it]);
  }
  return map;
}

function getInitials(fullName: string) {
  const s = (fullName || '').trim();
  if (!s) return 'HB';
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts[parts.length - 1]?.[0] || '';
  return (a + b).toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

function toCsv(rows: Array<Record<string, any>>) {
  const keys = Object.keys(rows[0] || {});
  const esc = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = keys.join(',');
  const lines = rows.map((r) => keys.map((k) => esc(r[k])).join(','));
  return [head, ...lines].join('\n');
}

/** ===== mock data (15 records) ===== */
function seedUsers(): USER[] {
  const now = Date.now();

  const make = (i: number, u: Partial<USER>): USER => ({
    user_id: `U${String(i).padStart(3, '0')}`,
    username: u.username ?? `user${i}`,
    first_name: u.first_name ?? `First${i}`,
    last_name: u.last_name ?? `Last${i}`,
    email: u.email ?? `user${i}@gmail.com`,
    phone: u.phone ?? `09${String(10000000 + i * 12345).slice(0, 8)}`,
    status: u.status ?? 'active',
    created_at: u.created_at ?? new Date(now - 1000 * 60 * 60 * 24 * (20 + i * 3)).toISOString(),
    updated_at: u.updated_at ?? new Date(now - 1000 * 60 * 30 * (2 + i)).toISOString(),
    last_login: u.last_login ?? new Date(now - 1000 * 60 * 15 * (i + 1)).toISOString(),
  });

  return [
    make(1, {
      username: 'khanh.anh',
      first_name: 'Khánh Anh',
      last_name: 'Trần',
      phone: '0901234567',
    }),
    make(2, {
      username: 'minhthu',
      first_name: 'Minh Thư',
      last_name: 'Nguyễn',
      status: 'locked',
      phone: '0912345678',
    }),
    make(3, { username: 'duc.huy', first_name: 'Đức Huy', last_name: 'Phạm' }),
    make(4, { username: 'thao.ng', first_name: 'Thảo', last_name: 'Ngô' }),
    make(5, { username: 'quangminh', first_name: 'Quang Minh', last_name: 'Lê' }),
    make(6, { username: 'ngan.ha', first_name: 'Ngân Hà', last_name: 'Võ' }),
    make(7, {
      username: 'tuan.kiet',
      first_name: 'Tuấn Kiệt',
      last_name: 'Đặng',
      status: 'locked',
    }),
    make(8, { username: 'phuong.thao', first_name: 'Phương Thảo', last_name: 'Bùi' }),
    make(9, { username: 'an.nhi', first_name: 'An Nhi', last_name: 'Đỗ' }),
    make(10, { username: 'bao.tran', first_name: 'Bảo', last_name: 'Trần' }),
    make(11, { username: 'hoang.long', first_name: 'Hoàng Long', last_name: 'Nguyễn' }),
    make(12, {
      username: 'ngoc.han',
      first_name: 'Ngọc Hân',
      last_name: 'Trịnh',
      status: 'locked',
    }),
    make(13, { username: 'linh.chi', first_name: 'Linh Chi', last_name: 'Phan' }),
    make(14, { username: 'gia.huy', first_name: 'Gia Huy', last_name: 'Huỳnh' }),
    make(15, { username: 'thanh.ngan', first_name: 'Thanh Ngân', last_name: 'Đinh' }),
  ].map((u, idx) => ({
    ...u,
    // randomize created/login slightly
    created_at: new Date(now - 1000 * 60 * 60 * 24 * (18 + idx * 5)).toISOString(),
    last_login: new Date(now - 1000 * 60 * 60 * (2 + (idx % 6) * 3)).toISOString(),
  }));
}

function seedOrders(): ORDER[] {
  const now = Date.now();

  const mk = (
    i: number,
    user_id: string,
    total: number,
    status: ORDER_STATUS,
    pay: PAYMENT_STATUS,
    daysAgo: number,
  ): ORDER => ({
    order_id: `O${String(i).padStart(4, '0')}`,
    user_id,
    order_number: `HB-${10000 + i}`,
    status,
    total_amount: total,
    payment_status: pay,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
  });

  let i = 1;
  const orders: ORDER[] = [];

  // U001: 4 orders
  orders.push(mk(i++, 'U001', 2400000, 'completed', 'paid', 25));
  orders.push(mk(i++, 'U001', 980000, 'shipping', 'paid', 9));
  orders.push(mk(i++, 'U001', 450000, 'processing', 'paid', 3));
  orders.push(mk(i++, 'U001', 1290000, 'confirmed', 'paid', 1));

  // U002 (locked): 2 orders
  orders.push(mk(i++, 'U002', 1200000, 'cancelled', 'refunded', 35));
  orders.push(mk(i++, 'U002', 780000, 'refunded', 'refunded', 12));

  // U003: 3 orders
  orders.push(mk(i++, 'U003', 3100000, 'completed', 'paid', 55));
  orders.push(mk(i++, 'U003', 560000, 'completed', 'paid', 27));
  orders.push(mk(i++, 'U003', 890000, 'pending', 'unpaid', 2));

  // U004: 1 order
  orders.push(mk(i++, 'U004', 1590000, 'completed', 'paid', 18));

  // U005: 5 orders
  orders.push(mk(i++, 'U005', 990000, 'completed', 'paid', 60));
  orders.push(mk(i++, 'U005', 2100000, 'completed', 'paid', 44));
  orders.push(mk(i++, 'U005', 650000, 'cancelled', 'refunded', 30));
  orders.push(mk(i++, 'U005', 430000, 'completed', 'paid', 14));
  orders.push(mk(i++, 'U005', 1780000, 'shipping', 'paid', 4));

  // U006: 0 order

  // U007 (locked): 2 orders
  orders.push(mk(i++, 'U007', 760000, 'completed', 'paid', 40));
  orders.push(mk(i++, 'U007', 2350000, 'processing', 'paid', 6));

  // U008: 1 order
  orders.push(mk(i++, 'U008', 520000, 'pending', 'unpaid', 1));

  // U009: 2 orders
  orders.push(mk(i++, 'U009', 680000, 'completed', 'paid', 22));
  orders.push(mk(i++, 'U009', 1450000, 'completed', 'paid', 8));

  // U010: 3 orders
  orders.push(mk(i++, 'U010', 1250000, 'completed', 'paid', 32));
  orders.push(mk(i++, 'U010', 890000, 'shipping', 'paid', 5));
  orders.push(mk(i++, 'U010', 490000, 'processing', 'paid', 2));

  // U011: 1 order
  orders.push(mk(i++, 'U011', 2200000, 'confirmed', 'paid', 1));

  // U012 (locked): 1 order
  orders.push(mk(i++, 'U012', 950000, 'confirmed', 'failed', 7));

  // U013: 2 orders
  orders.push(mk(i++, 'U013', 1990000, 'completed', 'paid', 28));
  orders.push(mk(i++, 'U013', 640000, 'completed', 'paid', 11));

  // U014: 1 order
  orders.push(mk(i++, 'U014', 1490000, 'completed', 'paid', 16));

  // U015: 0 order

  return orders;
}

function seedPointRule(): POINT_RULE {
  return {
    id: 'PR001',
    earn_rate: 0.01, // 1%
    redeem_rate: 1000, // 1 point = 1,000đ
    max_redeem_percent: 0.2, // tối đa 20%
    updated_at: nowIso(),
  };
}

function seedPointTxns(): POINT_TXN[] {
  const now = Date.now();
  const mk = (
    i: number,
    user_id: string,
    type: POINT_TXN['type'],
    points: number,
    note: string,
    daysAgo: number,
  ): POINT_TXN => ({
    id: `PT${String(i).padStart(4, '0')}`,
    user_id,
    type,
    points,
    note,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
  });

  let i = 1;
  return [
    // U001: active, nhiều giao dịch
    mk(i++, 'U001', 'earn', 120, 'Earn from HB-10001', 25),
    mk(i++, 'U001', 'redeem', -50, 'Redeem on HB-10002', 9),
    mk(i++, 'U001', 'earn', 45, 'Earn from HB-10003', 3),
    mk(i++, 'U001', 'adjust', 10, 'CS adjusted points', 2),

    // U002: locked
    mk(i++, 'U002', 'earn', 60, 'Earn from HB-10005', 35),
    mk(i++, 'U002', 'redeem', -60, 'Refunded order adjustment', 34),

    // U003
    mk(i++, 'U003', 'earn', 200, 'Earn from HB-10007', 55),
    mk(i++, 'U003', 'earn', 80, 'Earn from HB-10008', 27),
    mk(i++, 'U003', 'redeem', -90, 'Redeem on HB-10009', 2),

    // U004
    mk(i++, 'U004', 'earn', 90, 'Earn from HB-1010', 18),

    // U005
    mk(i++, 'U005', 'earn', 150, 'Earn from HB-1011', 60),
    mk(i++, 'U005', 'redeem', -40, 'Redeem on HB-1014', 14),
    mk(i++, 'U005', 'earn', 70, 'Earn from HB-1015', 4),

    // U007
    mk(i++, 'U007', 'earn', 75, 'Earn from HB-1016', 40),
    mk(i++, 'U007', 'redeem', -20, 'Redeem on HB-1017', 6),

    // U008
    mk(i++, 'U008', 'earn', 15, 'Welcome points', 2),

    // U009
    mk(i++, 'U009', 'earn', 65, 'Earn from HB-1019', 22),
    mk(i++, 'U009', 'earn', 120, 'Earn from HB-1020', 8),
    mk(i++, 'U009', 'redeem', -30, 'Redeem on HB-1020', 8),

    // U010
    mk(i++, 'U010', 'earn', 100, 'Earn from HB-1021', 32),
    mk(i++, 'U010', 'earn', 45, 'Earn from HB-1022', 5),
    mk(i++, 'U010', 'redeem', -60, 'Redeem on HB-1023', 2),

    // U012 (failed payment)
    mk(i++, 'U012', 'adjust', -10, 'Reverse points for failed payment', 7),

    // U013
    mk(i++, 'U013', 'earn', 130, 'Earn from HB-1025', 28),
    mk(i++, 'U013', 'earn', 55, 'Earn from HB-1026', 11),

    // U014
    mk(i++, 'U014', 'earn', 95, 'Earn from HB-1027', 16),
  ];
}

function seedVouchers(): VOUCHER[] {
  const now = Date.now();
  return [
    {
      voucher_id: 'V001',
      code: 'HB10',
      title: 'Giảm 10% cho đơn từ 1.000.000đ',
      discount_type: 'percent',
      discount_value: 10,
      min_order_value: 1000000,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
      end_at: new Date(now + 1000 * 60 * 60 * 24 * 20).toISOString(),
      status: 'active',
    },
    {
      voucher_id: 'V002',
      code: 'HB15',
      title: 'Giảm 15% (tối đa 200k) đơn từ 2.000.000đ',
      discount_type: 'percent',
      discount_value: 15,
      min_order_value: 2000000,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString(),
      end_at: new Date(now + 1000 * 60 * 60 * 24 * 8).toISOString(),
      status: 'active',
    },
    {
      voucher_id: 'V003',
      code: 'FREESHIP30',
      title: 'Giảm 30.000đ phí ship',
      discount_type: 'amount',
      discount_value: 30000,
      min_order_value: 500000,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 45).toISOString(),
      end_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: 'expired',
    },
    {
      voucher_id: 'V004',
      code: 'WELCOME50',
      title: 'Giảm 50.000đ cho khách mới',
      discount_type: 'amount',
      discount_value: 50000,
      min_order_value: 300000,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 60).toISOString(),
      end_at: new Date(now + 1000 * 60 * 60 * 24 * 365).toISOString(),
      status: 'paused',
    },
    {
      voucher_id: 'V005',
      code: 'HB200K',
      title: 'Giảm 200.000đ đơn từ 5.000.000đ',
      discount_type: 'amount',
      discount_value: 200000,
      min_order_value: 5000000,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      end_at: new Date(now + 1000 * 60 * 60 * 24 * 12).toISOString(),
      status: 'active',
    },
    {
      voucher_id: 'V006',
      code: 'FLASH5',
      title: 'Flash sale 5% toàn shop',
      discount_type: 'percent',
      discount_value: 5,
      min_order_value: 0,
      start_at: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
      end_at: new Date(now + 1000 * 60 * 60 * 24 * 1).toISOString(),
      status: 'active',
    },
  ];
}

function seedVoucherUsage(): VOUCHER_USAGE[] {
  const now = Date.now();
  const mk = (
    i: number,
    voucher_id: string,
    user_id: string,
    order_number: string,
    discount_amount: number,
    daysAgo: number,
  ): VOUCHER_USAGE => ({
    id: `VU${String(i).padStart(4, '0')}`,
    voucher_id,
    user_id,
    order_number,
    discount_amount,
    used_at: new Date(now - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
  });

  let i = 1;
  return [
    mk(i++, 'V001', 'U001', 'HB-10002', 98000, 9),
    mk(i++, 'V002', 'U003', 'HB-10009', 120000, 2),
    mk(i++, 'V001', 'U005', 'HB-1015', 178000, 4),
    mk(i++, 'V003', 'U005', 'HB-1013', 30000, 30),
    mk(i++, 'V006', 'U010', 'HB-1023', 24500, 2),
    mk(i++, 'V001', 'U013', 'HB-1025', 199000, 28),
    mk(i++, 'V005', 'U014', 'HB-1027', 200000, 16),
  ];
}
