import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';

// =====================
// Domain model (future MongoDB-friendly)
// =====================

type VoucherStatus = 'active' | 'paused' | 'expired' | 'deleted' | 'frozen';
type VoucherType = 'percent' | 'fixed' | 'freeship';

/**
 * Voucher entity used in UI.
 *
 * When moving to MongoDB, you typically have `_id`.
 * Keep `voucher_id` for now to avoid breaking UI/BA.
 */
interface Voucher {
  // MongoDB: _id?: string;
  voucher_id: string;

  code: string;
  voucher_name: string;
  type: VoucherType;
  value: number;
  min_order_value: number;
  usage_limit: number;
  used_count: number;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd
  status: VoucherStatus;
  created_at: string; // yyyy-mm-dd
}

type VoucherRowVM = Voucher & {
  computed_status: VoucherStatus;
  valueText: string;
  minOrderText: string;
  remaining: number;
  typeLabel: string;
  stt: number;
  startDateText: string;
  endDateText: string;
};

type PageMode = 'list' | 'detail' | 'edit';

type UIState = {
  q: string;
  f_status: '' | VoucherStatus;
  f_type: '' | VoucherType;
  pageSize: number;
  page: number;
  sortKey: keyof Voucher | null;
  sortDir: 'asc' | 'desc';
};

// =====================
// Data access layer (swap to API later)
// =====================

type VoucherUpdate = Partial<
  Pick<Voucher, 'value' | 'min_order_value' | 'usage_limit' | 'end_date' | 'status'>
>;

interface VoucherRepository {
  list$(): Observable<Voucher[]>;
  getSnapshot(): Voucher[];

  update(id: string, patch: VoucherUpdate): void;
  deleteHard(id: string): void;
}

class InMemoryVoucherRepository implements VoucherRepository {
  private readonly store$ = new BehaviorSubject<Voucher[]>([
    {
      voucher_id: 'V001',
      code: 'HERO10',
      voucher_name: 'Giảm 10% dịp lễ 30/4',
      type: 'percent',
      value: 10,
      min_order_value: 500000,
      usage_limit: 100,
      used_count: 45,
      start_date: '2025-04-20',
      end_date: '2025-05-03',
      status: 'active',
      created_at: '2025-01-01',
    },
    {
      voucher_id: 'V002',
      code: 'GIAM50K',
      voucher_name: 'Giảm 50.000đ cho đơn đầu tiên',
      type: 'fixed',
      value: 50000,
      min_order_value: 250000,
      usage_limit: 200,
      used_count: 150,
      start_date: '2025-01-01',
      end_date: '2026-01-01',
      status: 'active',
      created_at: '2025-01-02',
    },
    {
      voucher_id: 'V003',
      code: 'INTERNAL50',
      voucher_name: 'Mã nội bộ (Đã ẩn)',
      type: 'percent',
      value: 50,
      min_order_value: 0,
      usage_limit: 10,
      used_count: 1,
      start_date: '2025-01-01',
      end_date: '2026-01-01',
      status: 'deleted',
      created_at: '2025-01-03',
    },
  ]);

  list$(): Observable<Voucher[]> {
    return this.store$.asObservable();
  }

  getSnapshot(): Voucher[] {
    return this.store$.value;
  }

  update(id: string, patch: VoucherUpdate): void {
    const next = this.store$.value.map((v) => (v.voucher_id === id ? { ...v, ...patch } : v));
    this.store$.next(next);
  }

  deleteHard(id: string): void {
    this.store$.next(this.store$.value.filter((v) => v.voucher_id !== id));
  }
}

@Component({
  standalone: true,
  selector: 'app-management-voucher',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './management-voucher.html',
  styleUrls: ['./management-voucher.css'],
})
export class ManagementVoucher implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  // ====== MODE / SELECTION ======
  mode: PageMode = 'list';
  selectedId: string | null = null;
  detail: VoucherRowVM | null = null;

  // ====== EDIT MODEL ======
  editModel: {
    value: number;
    min_order_value: number;
    usage_limit: number;
    end_date: string;
  } | null = null;

  // ====== TODAY ISO for min date + expiration compare ======
  todayISO = this.toISODate(new Date());

  // ====== REPO ======
  private readonly repo: VoucherRepository = new InMemoryVoucherRepository();

  // ====== UI STATE (Reactive) ======
  private readonly state$ = new BehaviorSubject<UIState>({
    q: '',
    f_status: '',
    f_type: '',
    pageSize: 10,
    page: 1,
    sortKey: null,
    sortDir: 'asc',
  });

  // convenience getters for template bindings (ngModel)
  get q() {
    return this.state$.value.q;
  }
  set q(v: string) {
    this.patchState({ q: v ?? '' });
  }

  get f_status() {
    return this.state$.value.f_status;
  }
  set f_status(v: '' | VoucherStatus) {
    this.patchState({ f_status: v ?? '' });
  }

  get f_type() {
    return this.state$.value.f_type;
  }
  set f_type(v: '' | VoucherType) {
    this.patchState({ f_type: v ?? '' });
  }

  get pageSize() {
    return this.state$.value.pageSize;
  }
  set pageSize(v: number) {
    this.patchState({ pageSize: Number(v) || 10 });
  }

  get sortKey() {
    return this.state$.value.sortKey;
  }
  get sortDir() {
    return this.state$.value.sortDir;
  }

  readonly vm$ = combineLatest([this.repo.list$(), this.state$]).pipe(
    map(([data, st]) => {
      let rows = [...data];

      // Summary calculations
      let activeCount = 0;
      let pausedCount = 0;
      let expiredCount = 0;

      data.forEach(v => {
        const s = this.computeStatus(v);
        if (s === 'active' || s === 'frozen') activeCount++;
        else if (s === 'paused') pausedCount++;
        else if (s === 'expired') expiredCount++;
      });

      const summary = { activeCount, pausedCount, expiredCount };

      // search
      const keyword = st.q.trim().toLowerCase();
      if (keyword) {
        rows = rows.filter(
          (v) =>
            v.code.toLowerCase().includes(keyword) ||
            v.voucher_name.toLowerCase().includes(keyword) ||
            v.voucher_id.toLowerCase().includes(keyword),
        );
      }

      // filters
      if (st.f_status) rows = rows.filter((v) => this.computeStatus(v) === st.f_status);
      if (st.f_type) rows = rows.filter((v) => v.type === st.f_type);

      // sort
      if (st.sortKey) {
        const key = st.sortKey;
        const dir = st.sortDir;
        rows.sort((a, b) => {
          const A = (a as any)[key];
          const B = (b as any)[key];
          if (A < B) return dir === 'asc' ? -1 : 1;
          if (A > B) return dir === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // paging
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / st.pageSize));
      const page = Math.min(st.page, totalPages);
      const startIndex = (page - 1) * st.pageSize;
      const pageRows = rows.slice(startIndex, startIndex + st.pageSize);

      return {
        rows: pageRows.map((v, i) => this.toRowVM(v, startIndex + i + 1)),
        total,
        page,
        totalPages,
        summary,
        startIndex: startIndex + 1,
        endIndex: startIndex + pageRows.length
      };
    }),
  );

  ngOnInit(): void {
    // read query param id -> open detail
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qm) => {
      const id = qm.get('id');
      if (!id) {
        this.mode = 'list';
        this.selectedId = null;
        this.detail = null;
        this.editModel = null;
        return;
      }

      const found = this.repo.getSnapshot().find((x) => x.voucher_id === id);
      if (!found) return;

      this.mode = 'detail';
      this.selectedId = id;
      this.detail = this.toRowVM(found, 0);
      this.editModel = null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ====== UI EVENTS ======
  stopEvent(e: Event) {
    e.stopPropagation();
  }

  openDetail(id: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id },
      queryParamsHandling: 'merge',
    });
  }

  backToList() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
    });
  }

  // ====== FILTER + PAGE ======
  resetFilters() {
    this.state$.next({
      q: '',
      f_status: '',
      f_type: '',
      pageSize: 10,
      page: 1,
      sortKey: null,
      sortDir: 'asc',
    });
  }

  onChangeQ(v: string) {
    this.patchState({ q: v ?? '', page: 1 });
  }

  onChangeStatus(v: '' | VoucherStatus) {
    this.patchState({ f_status: v ?? '', page: 1 });
  }

  onChangeType(v: '' | VoucherType) {
    this.patchState({ f_type: v ?? '', page: 1 });
  }

  onChangePageSize(v: number) {
    this.patchState({ pageSize: Number(v) || 10, page: 1 });
  }

  toggleSort(key: keyof Voucher) {
    const st = this.state$.value;
    if (st.sortKey === key) {
      this.patchState({ sortDir: st.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.patchState({ sortKey: key, sortDir: 'asc' });
    }
  }

  /**
   * Table header icon (match product page behaviour)
   */
  sortIcon(key: keyof Voucher): string {
    const st = this.state$.value;
    if (st.sortKey !== key) return 'fa-sort';
    return st.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  setPage(p: number) {
    this.patchState({ page: Math.max(1, Math.floor(p)) });
  }

  private patchState(partial: Partial<UIState>) {
    this.state$.next({ ...this.state$.value, ...partial });
  }

  // ====== DETAIL -> EDIT ======
  enterEdit() {
    if (!this.detail) return;

    this.mode = 'edit';
    this.editModel = {
      value: this.detail.value,
      min_order_value: this.detail.min_order_value,
      usage_limit: this.detail.usage_limit,
      end_date: this.detail.end_date,
    };
  }

  cancelEdit() {
    this.mode = 'detail';
    this.editModel = null;
  }

  saveEdit() {
    if (!this.detail || !this.editModel) return;

    // validate end_date >= today
    if (this.editModel.end_date < this.todayISO) {
      alert('Ngày hết hạn phải lớn hơn hoặc bằng hôm nay.');
      return;
    }

    const id = this.detail.voucher_id;
    this.repo.update(id, {
      value: Number(this.editModel.value) || 0,
      min_order_value: Number(this.editModel.min_order_value) || 0,
      usage_limit: Number(this.editModel.usage_limit) || 0,
      end_date: this.editModel.end_date,
    });

    // refresh detail
    const fresh = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (fresh) this.detail = this.toRowVM(fresh, this.detail.stt);

    this.mode = 'detail';
    this.editModel = null;
  }

  // ====== ACTIONS ======
  toggleActivePaused(id: string) {
    const v = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (!v) return;

    const computed = this.computeStatus(v);
    if (computed === 'expired' || computed === 'deleted') return;

    const next: VoucherStatus = v.status === 'paused' ? 'active' : 'paused';
    this.repo.update(id, { status: next });
    this.refreshDetailIfOpen(id);
  }

  freeze(id: string) {
    const v = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (!v) return;
    if (this.computeStatus(v) === 'deleted') return;

    this.repo.update(id, { status: 'frozen' });
    this.refreshDetailIfOpen(id);
  }

  unfreeze(id: string) {
    const v = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (!v) return;
    if (this.computeStatus(v) === 'deleted') return;

    // unfreeze -> active (rule can be changed later)
    this.repo.update(id, { status: 'active' });
    this.refreshDetailIfOpen(id);
  }

  hardDelete(id: string) {
    if (!confirm('Xóa vĩnh viễn voucher này?')) return;

    this.repo.deleteHard(id);

    if (this.selectedId === id) this.backToList();
  }

  exportCsvSnapshot() {
    // TODO: replace by backend export endpoint later
    console.log('Export CSV snapshot');
  }

  private refreshDetailIfOpen(id: string) {
    if (this.selectedId !== id || !this.detail) return;
    const fresh = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (!fresh) return;
    this.detail = this.toRowVM(fresh, this.detail.stt);
  }

  // ====== LABELS ======
  statusLabel(s: VoucherStatus): string {
    switch (s) {
      case 'active':
        return 'Hoạt động';
      case 'paused':
        return 'Tạm dừng';
      case 'frozen':
        return 'Đóng băng';
      case 'expired':
        return 'Hết hạn';
      case 'deleted':
        return 'Đã ẩn';
      default:
        return s;
    }
  }

  statusBadgeClass(s: VoucherStatus): string {
    switch (s) {
      case 'active':
        return 'hb-st-active';
      case 'paused':
        return 'hb-st-paused';
      case 'frozen':
        return 'hb-st-frozen';
      case 'expired':
        return 'hb-st-expired';
      case 'deleted':
        return 'hb-st-deleted';
      default:
        return '';
    }
  }

  // ====== HELPERS ======
  private computeStatus(v: Voucher): VoucherStatus {
    if (v.status === 'deleted') return 'deleted';

    // Since dates are yyyy-mm-dd, string compare works.
    if (v.end_date && v.end_date < this.todayISO) return 'expired';

    return v.status;
  }

  private toRowVM(v: Voucher, stt: number): VoucherRowVM {
    const computed = this.computeStatus(v);

    const valueText =
      v.type === 'percent'
        ? `${v.value}%`
        : v.type === 'fixed'
          ? `${v.value.toLocaleString()}đ`
          : `Free ship`;

    const typeLabel =
      v.type === 'percent' ? 'Giảm %' : v.type === 'fixed' ? 'Giảm tiền' : 'Free ship';

    return {
      ...v,
      computed_status: computed,
      valueText,
      minOrderText: `${v.min_order_value.toLocaleString()}đ`,
      remaining: Math.max(0, v.usage_limit - v.used_count),
      typeLabel,
      stt,
      startDateText: this.fmtISODate(v.start_date),
      endDateText: this.fmtISODate(v.end_date),
    };
  }

  private fmtISODate(iso: string): string {
    if (!iso) return '—';
    // iso is yyyy-mm-dd
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private toISODate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
