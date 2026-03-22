import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap, catchError, forkJoin } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { CustomerService } from '../../../services/customer.service';

/** ===== Types (scope đúng FDD khách hàng) ===== */
type USER_STATUS = 'unlocked' | 'locked';

type ORDER_STATUS =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'uncompleted';

type PAYMENT_STATUS = 'unpaid' | 'paid' | 'refunded' | 'failed';

export type USER = {
  _id: string; 
  user_id: string; // for compatibility with template #U001
  username: string;
  name: string;
  email: string;
  phone: string;
  status: USER_STATUS;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  points?: number;
};

export type ORDER = {
  _id: string;
  user_id: string;
  order_number: string;
  status: ORDER_STATUS;
  total_amount: number;
  payment_status: PAYMENT_STATUS;
  createdAt: string;
};

export type POINT_TXN = {
  _id: string;
  user_id: string;
  action: 'earn' | 'redeem' | 'adjust';
  amount: number;
  note: string;
  createdAt: string;
};

type MODE = 'list' | 'detail';
type DETAIL_TAB = 'overview' | 'voucher_points' | 'orders' | 'reports';

type SortKey = 'name' | 'createdAt' | 'last_login' | 'orders' | 'spent' | 'status';
type SortDir = 'asc' | 'desc';

type CustomerRowVM = {
  user: USER;
  display_name: string;
  initials: string;
  orders_count: number;
  total_spent: number;
  points_balance: number;
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

type DetailVM = {
  mode: MODE;
  tab: DETAIL_TAB;

  user: USER;
  display_name: string;
  initials: string;

  orders_count: number;
  total_spent: number;

  points_balance: number;
  active_voucher_count: number;

  point_history: any[];
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
export class ManagementCustomers implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);

  /** ===== list state observers ===== */
  private readonly q$ = new BehaviorSubject<string>('');
  private readonly status$ = new BehaviorSubject<'all' | USER_STATUS>('all');
  private readonly sort$ = new BehaviorSubject<{ key: SortKey; dir: SortDir }>({
    key: 'createdAt',
    dir: 'desc',
  });
  private readonly page$ = new BehaviorSubject<number>(1);
  private readonly pageSize$ = new BehaviorSubject<number>(10);
  private readonly refreshList$ = new BehaviorSubject<void>(undefined);

  /** ===== route state ===== */
  readonly routeState$ = this.route.queryParamMap.pipe(
    map((qp) => {
      const mode = (qp.get('mode') as MODE) || 'list';
      const id = qp.get('id') || '';
      const tab = (qp.get('tab') as DETAIL_TAB) || 'overview';
      return { mode, id, tab };
    }),
  );

  /** ===== detail tab local ===== */
  private readonly detailTab$ = new BehaviorSubject<DETAIL_TAB>('overview');
  private readonly refreshDetail$ = new BehaviorSubject<void>(undefined);

  /** ===== Data Observables ===== */

  // Statistics
  readonly summary$ = this.refreshList$.pipe(
    switchMap(() => this.customerService.getStatistics().pipe(
      map(res => ({
        totalCustomers: res.data.totalCustomers,
        newThisMonth: res.data.newThisMonth,
        lockedCount: res.data.lockedAccounts
      })),
      catchError(() => of({ totalCustomers: 0, newThisMonth: 0, lockedCount: 0 }))
    ))
  );

  // List View Model
  readonly listVm$: Observable<ListVM> = combineLatest([
    this.routeState$,
    this.q$,
    this.status$,
    this.sort$,
    this.page$,
    this.pageSize$,
    this.summary$,
    this.refreshList$
  ]).pipe(
    switchMap(([rs, q, status, sort, page, pageSize, summary]) => {
      if (rs.mode !== 'list') {
        return of({
          mode: rs.mode as MODE,
          q, status, sortKey: sort.key, sortDir: sort.dir,
          total: 0, page, pageSize, pageCount: 1, items: [], summary
        });
      }

      const queryParams = {
        page,
        limit: pageSize,
        search: q,
        status: status === 'all' ? '' : status,
        sortBy: sort.key,
        sortOrder: sort.dir
      };

      return this.customerService.getCustomers(queryParams).pipe(
        map(res => {
          const items = res.data.customers.map((c: any, i: number) => {
            const display_name = c.name;
            const initials = getInitials(display_name);
            const total_spent = c.totalSpent || 0;
            
            let rank = 'Đồng';
            let rankClass = 'rank-bronze';
            if (total_spent >= 30000000) { rank = 'Kim cương'; rankClass = 'rank-diamond'; }
            else if (total_spent >= 15000000) { rank = 'Vàng'; rankClass = 'rank-gold'; }
            else if (total_spent >= 5000000) { rank = 'Bạc'; rankClass = 'rank-silver'; }

            return {
              user: { ...c, user_id: c._id },
              display_name,
              initials,
              orders_count: c.orderCount || 0,
              total_spent,
              points_balance: c.points || 0,
              rank,
              rankClass,
              stt: (page - 1) * pageSize + i + 1
            } as CustomerRowVM;
          });

          return {
            mode: 'list' as MODE,
            q,
            status,
            sortKey: sort.key,
            sortDir: sort.dir,
            total: res.data.total,
            page: res.data.page,
            pageSize,
            pageCount: res.data.totalPages,
            items,
            summary
          } as ListVM;
        }),
        catchError(err => {
          console.error('Error fetching customers', err);
          return of({
            mode: 'list' as MODE,
            q, status, sortKey: sort.key, sortDir: sort.dir,
            total: 0, page, pageSize, pageCount: 1, items: [], summary
          });
        })
      );
    })
  );

  // Detail View Model
  readonly detailVm$: Observable<DetailVM | null> = combineLatest([
    this.routeState$,
    this.detailTab$,
    this.refreshDetail$
  ]).pipe(
    switchMap(([rs, tabLocal]) => {
      if (rs.mode !== 'detail' || !rs.id) return of(null);

      const tab = rs.tab || tabLocal || 'overview';

      return this.customerService.getCustomerDetail(rs.id).pipe(
        switchMap(detailRes => {
          const user = detailRes.data;
          const display_name = user.name;
          const initials = getInitials(display_name);

          // Depending on tab, fetch more data
          const detailData$ = {
            orders: tab === 'orders' || tab === 'overview' 
              ? this.customerService.getCustomerOrders(rs.id)
              : of({ data: [] }),
            points: tab === 'voucher_points'
              ? this.customerService.getCustomerPoints(rs.id)
              : of({ data: [] })
          };

          return forkJoin(detailData$).pipe(
            map(extra => ({
              mode: 'detail' as MODE,
              tab,
              user: { ...user, user_id: user._id },
              display_name,
              initials,
              orders_count: user.stats?.orderCount || 0,
              total_spent: user.stats?.totalSpent || 0,
              points_balance: user.points || 0,
              active_voucher_count: 0,
              point_history: extra.points.data || [],
              orders: extra.orders.data || user.recentOrders || []
            } as DetailVM))
          );
        }),
        catchError(err => {
          console.error('Error fetching customer detail', err);
          return of(null);
        })
      );
    })
  );

  ngOnInit(): void { }

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
    this.sort$.next({ key: 'createdAt', dir: 'desc' });
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

  sortIcon(key: string): string {
    const cur = this.sort$.value;
    if (cur.key !== (key as any)) return 'fa-sort';
    return cur.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

  /** ===== Actions ===== */
  toggleLock(user_id: string) {
    this.customerService.getCustomerDetail(user_id).pipe(
      switchMap(res => {
        const currentStatus = res.data.status;
        const nextStatus = currentStatus === 'locked' ? 'unlocked' : 'locked';
        return this.customerService.updateCustomerStatus(user_id, nextStatus as any);
      })
    ).subscribe({
      next: () => {
        this.refreshList$.next();
        this.refreshDetail$.next();
      },
      error: (err) => alert('Lỗi khi cập nhật trạng thái: ' + err.message)
    });
  }

  /** ===== template helpers ===== */
  formatMoney(v: number) {
    return (v || 0).toLocaleString('vi-VN') + 'đ';
  }

  statusLabel(s: USER_STATUS) {
    return s === 'unlocked' ? 'Hoạt động' : 'Tạm khóa';
  }

  orderStatusLabel(s: string) {
    const m: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Hoàn tiền',
      uncompleted: 'Chưa hoàn thành',
    };
    return m[s] || s;
  }

  payStatusLabel(s: string) {
    const m: Record<string, string> = {
      unpaid: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      refunded: 'Hoàn tiền',
      failed: 'Thất bại',
    };
    return m[s] || s;
  }
  
  // Modal state (moved to ConfirmModal or integrated)
  isCancelModalOpen = false;
  cancelOrderId: string | null = null;
  cancelOrderNumber = '';
  closeCancelModal() { this.isCancelModalOpen = false; }
  confirmCancelOrder() { this.closeCancelModal(); }

  exportCustomersCsv(vm: ListVM) {
    const rows = vm.items.map(r => ({
      ID: r.user.user_id,
      Name: r.display_name,
      Email: r.user.email,
      Phone: r.user.phone,
      Status: r.user.status,
      Orders: r.orders_count,
      Spent: r.total_spent,
      Joined: r.user.createdAt
    }));
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + keys.join(",") + "\n"
      + rows.map(e => keys.map(k => (e as any)[k]).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/** ===== helpers ===== */
function getInitials(fullName: string) {
  const s = (fullName || '').trim();
  if (!s) return 'HB';
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts[parts.length - 1]?.[0] || '';
  return (a + b).toUpperCase();
}
