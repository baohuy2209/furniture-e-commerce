import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil, finalize, forkJoin } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { UserService } from '../../../services/user-service';
import { OrderServices } from '../../../services/order-services';
import { IUser, IOrderAdmin } from '../../../../interface';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'list' | 'detail';
type DetailTab = 'overview' | 'orders';
type SortKey = 'name' | 'createdAt' | 'last_login' | 'orders' | 'spent' | 'status';
type SortDir = 'asc' | 'desc';

// ─── View Models ─────────────────────────────────────────────────────────────

interface CustomerRowVM {
  user: IUser;
  displayName: string;
  initials: string;
  ordersCount: number;
  totalSpent: number;
  rank: string;
  rankClass: string;
  stt: number;
}

interface CustomerDetailVM {
  user: IUser;
  displayName: string;
  initials: string;
  orders: IOrderAdmin[];
  ordersCount: number;
  totalSpent: number;
  rank: string;
  rankClass: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-management-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal, DatePipe],
  templateUrl: './management-customers.html',
  styleUrls: ['./management-customers.css'],
})
export class ManagementCustomers implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mode: Mode = 'list';
  detailTab: DetailTab = 'overview';
  selectedId: string | null = null;

  // ── Loading ──────────────────────────────────────────────────────────────
  loading = false;
  detailLoading = false;
  lockLoading = false;

  // ── Data streams ────────────────────────────────────────────────────────
  private users$ = new BehaviorSubject<IUser[]>([]);
  private orders$ = new BehaviorSubject<IOrderAdmin[]>([]);

  detail: CustomerDetailVM | null = null;

  // ── Lock modal ───────────────────────────────────────────────────────────
  lockModalOpen = false;
  lockTargetUser: IUser | null = null;

  // ── Filters ──────────────────────────────────────────────────────────────
  q = '';
  f_status = 'all';
  page = 1;
  pageSize = 10;

  private q$ = new BehaviorSubject<string>('');
  private status$ = new BehaviorSubject<string>('all');
  private page$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);
  private sort$ = new BehaviorSubject<{ key: SortKey; dir: SortDir }>({
    key: 'createdAt',
    dir: 'desc',
  });

  // ── VM stream ────────────────────────────────────────────────────────────
  vm$ = combineLatest([
    this.users$,
    this.orders$,
    this.q$,
    this.status$,
    this.page$,
    this.pageSize$,
    this.sort$,
  ]).pipe(
    map(([users, orders, q, status, page, pageSize, sort]) => {
      // Map orders theo user
      const ordersByUser = new Map<string, IOrderAdmin[]>();
      orders.forEach((o) => {
        const uid = o.user_id?._id ?? '';
        if (!uid) return;
        ordersByUser.set(uid, [...(ordersByUser.get(uid) ?? []), o]);
      });

      const allRows: CustomerRowVM[] = users.map((u) => {
        const userOrders = ordersByUser.get(u._id) ?? [];
        const totalSpent = userOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
        return {
          user: u,
          displayName: u.name ?? u.username ?? '—',
          initials: getInitials(u.name ?? u.username ?? ''),
          ordersCount: userOrders.length,
          totalSpent,
          ...calcRank(totalSpent),
          stt: 0,
        };
      });

      // Summary
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const summary = {
        totalCustomers: allRows.length,
        newThisMonth: allRows.filter((r) => new Date(r.user.createdAt) >= firstOfMonth).length,
        lockedCount: allRows.filter((r) => r.user.status === 'locked').length,
      };

      // Filter
      const keyword = q.trim().toLowerCase();
      let filtered = allRows.filter((r) => {
        const u = r.user;
        const matchQ =
          !keyword ||
          r.displayName.toLowerCase().includes(keyword) ||
          u._id.toLowerCase().includes(keyword) ||
          u.email.toLowerCase().includes(keyword) ||
          (u.phone ?? '').toLowerCase().includes(keyword) ||
          (u.username ?? '').toLowerCase().includes(keyword);
        const matchStatus = status === 'all' || u.status === status;
        return matchQ && matchStatus;
      });

      // Sort
      filtered.sort((a, b) => sortRows(a, b, sort.key, sort.dir));

      // Paginate
      const total = filtered.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.max(1, Math.min(page, pageCount));
      const start = (safePage - 1) * pageSize;
      const items = filtered
        .slice(start, start + pageSize)
        .map((r, i) => ({ ...r, stt: start + i + 1 }));

      return {
        items,
        total,
        page: safePage,
        pageSize,
        pageCount,
        summary,
        sortKey: sort.key,
        sortDir: sort.dir,
      };
    }),
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private orderService: OrderServices,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load all data ────────────────────────────────────────────────────────
  private loadAll(): void {
    this.loading = true;
    forkJoin({
      users: this.userService.getAllInfoUser(),
      orders: this.orderService.getAllOrdersAdmin(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ users, orders }) => {
          this.users$.next(Array.isArray(users?.data) ? users.data : []);
          this.orders$.next(Array.isArray(orders?.data) ? orders.data : []);
        },
        error: () => {
          this.users$.next([]);
          this.orders$.next([]);
        },
      });
  }

  // ── Load detail ──────────────────────────────────────────────────────────
  private loadDetail(userId: string): void {
    this.detail = null;
    this.detailLoading = true;
    this.cdr.detectChanges();

    const user = this.users$.value.find((u) => u._id === userId) ?? null;
    const allOrders = this.orders$.value;
    const userOrders = allOrders
      .filter((o) => (o.user_id?._id ?? '') === userId)
      .sort((a, b) => +new Date(String(b.createdAt)) - +new Date(String(a.createdAt)));

    if (user) {
      const totalSpent = userOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
      this.detail = {
        user,
        displayName: user.name ?? user.username ?? '—',
        initials: getInitials(user.name ?? user.username ?? ''),
        orders: userOrders,
        ordersCount: userOrders.length,
        totalSpent,
        ...calcRank(totalSpent),
      };
    }

    this.detailLoading = false;
    this.cdr.detectChanges();
  }

  // ── Route ─────────────────────────────────────────────────────────────────
  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const tab = (qp.get('tab') as DetailTab) || 'overview';

      if (!id) {
        this.selectedId = null;
        this.mode = 'list';
        this.detail = null;
        return;
      }

      this.detailTab = tab;
      if (id !== this.selectedId) {
        this.selectedId = id;
        this.mode = 'detail';
        // Nếu data chưa load xong thì chờ users$ emit
        if (this.users$.value.length > 0) {
          this.loadDetail(id);
        } else {
          const sub = this.users$.subscribe((users) => {
            if (users.length > 0) {
              this.loadDetail(id);
              sub.unsubscribe();
            }
          });
        }
      }
    });
  }

  private syncRoute(id: string | null, tab: DetailTab = 'overview', push = true): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: id ?? null, tab: id ? tab : null },
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  openDetail(userId: string): void {
    this.syncRoute(userId, 'overview');
  }

  backToList(): void {
    this.syncRoute(null);
    this.selectedId = null;
    this.mode = 'list';
    this.detail = null;
  }

  setDetailTab(tab: DetailTab): void {
    this.detailTab = tab;
    this.syncRoute(this.selectedId, tab, false);
  }

  // ── Filters ──────────────────────────────────────────────────────────────
  onSearchChange(v: string): void {
    this.q = v;
    this.q$.next(v);
    this.page$.next(1);
  }
  setStatus(v: string): void {
    this.f_status = v;
    this.status$.next(v);
    this.page$.next(1);
  }
  setPage(p: number): void {
    this.page = p;
    this.page$.next(p);
  }
  setPageSize(n: number): void {
    this.pageSize = Number(n);
    this.pageSize$.next(this.pageSize);
    this.page$.next(1);
  }

  resetFilters(): void {
    this.q = '';
    this.f_status = 'all';
    this.page = 1;
    this.pageSize = 10;
    this.q$.next('');
    this.status$.next('all');
    this.page$.next(1);
    this.pageSize$.next(10);
    this.sort$.next({ key: 'createdAt', dir: 'desc' });
  }

  toggleSort(key: SortKey): void {
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

  // ── Lock / Unlock ─────────────────────────────────────────────────────────
  openLockModal(user: IUser): void {
    this.lockTargetUser = user;
    this.lockModalOpen = true;
  }

  onCancelLock(): void {
    this.lockModalOpen = false;
    this.lockTargetUser = null;
  }

  onConfirmLock(): void {
    const user = this.lockTargetUser;
    this.lockModalOpen = false;
    this.lockTargetUser = null;
    if (!user) return;

    const newStatus = user.status === 'locked' ? 'unlocked' : 'locked';
    this.lockLoading = true;

    this.userService
      .changeStatusAccount(user._id, newStatus)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.lockLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          // Cập nhật local state
          const updated = res.data;
          this.users$.next(this.users$.value.map((u) => (u._id === updated._id ? updated : u)));
          // Nếu đang xem detail user này → refresh
          if (this.selectedId === updated._id) {
            this.loadDetail(updated._id);
          }
        },
        error: () => {},
      });
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exportCsv(items: CustomerRowVM[]): void {
    const headers = [
      'id',
      'username',
      'name',
      'email',
      'phone',
      'status',
      'orders',
      'total_spent',
      'created_at',
    ];
    const lines = [
      headers.join(','),
      ...items.map((r) => {
        const u = r.user;
        return [
          u._id,
          u.username,
          csvSafe(r.displayName),
          u.email,
          u.phone ?? '',
          u.status,
          r.ordersCount,
          r.totalSpent,
          String(u.createdAt),
        ].join(',');
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  statusLabel(s: string): string {
    return s === 'locked' ? 'Tạm khóa' : 'Hoạt động';
  }
  formatMoney(v: number): string {
    return (v ?? 0).toLocaleString('vi-VN') + 'đ';
  }

  orderStatusLabel(s: string): string {
    const m: Record<string, string> = {
      uncompleted: 'Chưa hoàn tất',
      completed: 'Hoàn tất',
      pending: 'Chờ soạn',
      packed: 'Đóng gói',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã huỷ',
      returned: 'Trả hàng',
    };
    return m[s] ?? s;
  }

  orderStatusPillClass(s: string): string {
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

  payStatusLabel(s: string): string {
    const m: Record<string, string> = {
      unpaid: 'Chưa TT',
      paid: 'Đã TT',
      refunded: 'Hoàn tiền',
    };
    return m[s] ?? s;
  }

  payStatusPillClass(s: string): string {
    const m: Record<string, string> = {
      unpaid: 'pill-unpaid',
      paid: 'pill-paid',
      refunded: 'pill-refunded',
    };
    return m[s] ?? '';
  }

  get lockModalMessage(): string {
    if (!this.lockTargetUser) return '';
    const action = this.lockTargetUser.status === 'locked' ? 'Mở khóa' : 'Tạm khóa';
    return `${action} tài khoản "${this.lockTargetUser.name ?? this.lockTargetUser.username}"?`;
  }

  get lockModalTitle(): string {
    if (!this.lockTargetUser) return '';
    return this.lockTargetUser.status === 'locked' ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản';
  }
  // Thêm vào component
  completedCount(orders: IOrderAdmin[]): number {
    return orders.filter((o) => o.status === 'completed').length;
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'HB';
  const a = parts[0]?.[0] ?? '';
  const b = parts[parts.length - 1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function calcRank(totalSpent: number): { rank: string; rankClass: string } {
  if (totalSpent >= 30_000_000) return { rank: 'Kim cương', rankClass: 'rank-diamond' };
  if (totalSpent >= 15_000_000) return { rank: 'Vàng', rankClass: 'rank-gold' };
  if (totalSpent >= 5_000_000) return { rank: 'Bạc', rankClass: 'rank-silver' };
  return { rank: 'Đồng', rankClass: 'rank-bronze' };
}

function sortRows(a: CustomerRowVM, b: CustomerRowVM, key: SortKey, dir: SortDir): number {
  const m = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'name':
      return a.displayName.localeCompare(b.displayName) * m;
    case 'createdAt':
      return (+new Date(String(a.user.createdAt)) - +new Date(String(b.user.createdAt))) * m;
    case 'last_login':
      return (
        ((a.user.last_login ? +new Date(a.user.last_login) : 0) -
          (b.user.last_login ? +new Date(b.user.last_login) : 0)) *
        m
      );
    case 'orders':
      return (a.ordersCount - b.ordersCount) * m;
    case 'spent':
      return (a.totalSpent - b.totalSpent) * m;
    case 'status':
      return ((a.user.status === 'locked' ? 0 : 1) - (b.user.status === 'locked' ? 0 : 1)) * m;
    default:
      return 0;
  }
}

function csvSafe(v: string): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
