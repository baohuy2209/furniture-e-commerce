import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

// =====================
// Domain model (future MongoDB-friendly)
// =====================

type VoucherStatus = 'active' | 'paused' | 'expired' | 'pending';
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
  start_date: string; // yyyy-mm-ddThh:mm
  end_date: string; // yyyy-mm-ddThh:mm
  status: VoucherStatus;
  created_at: string; // yyyy-mm-dd
  description?: string;
  revenue_generated?: number;
  appliedTo?: 'all' | 'specific';
  applied_products?: string[];
}

type VoucherRowVM = Voucher & {
  computed_status: VoucherStatus;
  valueText: string;
  revenueText: string;
  minOrderText: string;
  remaining: number;
  typeLabel: string;
  stt: number;
  startDateText: string;
  endDateText: string;
  appliedToText: string;
};

type PageMode = 'list' | 'detail' | 'edit' | 'create';

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
  Pick<
    Voucher,
    | 'value'
    | 'min_order_value'
    | 'usage_limit'
    | 'start_date'
    | 'end_date'
    | 'status'
    | 'appliedTo'
    | 'applied_products'
  >
>;

interface VoucherRepository {
  list$(): Observable<Voucher[]>;
  getSnapshot(): Voucher[];

  update(id: string, patch: VoucherUpdate): void;
  create(item: Voucher): void;
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
      start_date: '2025-04-20T00:00',
      end_date: '2025-05-03T23:59',
      status: 'active',
      created_at: '2025-01-01',
      description:
        'Chương trình tri ân khách hàng dịp lễ lớn, áp dụng cho tất cả các đơn hàng mua sản phẩm nội thất.',
      revenue_generated: 154000000,
      appliedTo: 'all',
      applied_products: [],
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
      start_date: '2025-01-01T00:00',
      end_date: '2026-01-01T23:59',
      status: 'active',
      created_at: '2025-01-02',
      description:
        'Mã giảm giá dành riêng cho các khách hàng lần đầu mua sắm tại nền tảng HomeBase.',
      revenue_generated: 45000000,
      appliedTo: 'all',
      applied_products: [],
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
      start_date: '2025-01-01T08:00',
      end_date: '2026-01-01T23:59',
      status: 'active', // Changed from deleted
      created_at: '2025-01-03',
      description: 'Mã nội bộ không công khai, dành cho nhân viên công ty.',
      revenue_generated: 2000000,
      appliedTo: 'specific',
      applied_products: ['SOFA-001', 'TABLE-002'],
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

  create(item: Voucher): void {
    const next = [item, ...this.store$.value];
    this.store$.next(next);
  }

  deleteHard(id: string): void {
    this.store$.next(this.store$.value.filter((v) => v.voucher_id !== id));
  }
}

@Component({
  standalone: true,
  selector: 'app-management-voucher',
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal],
  templateUrl: './management-voucher.html',
  styleUrls: ['./management-voucher.css'],
})
export class ManagementVoucher implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  // ====== MODE / SELECTION ======
  mode: PageMode = 'list';
  selectedId: string | null = null;
  detail: VoucherRowVM | null = null;

  // ====== EDIT MODEL ======
  editModel: {
    value: number;
    min_order_value: number;
    usage_limit: number;
    start_date: string;
    end_date: string;
    appliedTo: 'all' | 'specific';
    applied_products_text: string;
  } | null = null;

  // ====== CREATE MODEL ======
  createModel: {
    code: string;
    voucher_name: string;
    type: VoucherType;
    value: number;
    min_order_value: number;
    usage_limit: number;
    start_date: string;
    end_date: string;
    description: string;
    appliedTo: 'all' | 'specific';
    applied_products_text: string;
  } | null = null;

  // ====== CREATE STEP ======
  createStep: 1 | 2 = 1;

  saveModalOpen = false;
  discardModalOpen = false;

  // Deletion Modal state
  deleteModalOpen = false;
  deleteVoucherId: string | null = null;
  deleteModalTitle = '';
  deleteModalMessage = '';

  // Alert modal state
  alertModalOpen = false;
  alertModalTitle = '';
  alertModalMessage = '';

  // ====== TODAY ISO for min date + expiration compare ======
  todayISO = this.toISODateTime(new Date());

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
      let pendingCount = 0;

      data.forEach((v) => {
        const s = this.computeStatus(v);
        if (s === 'active') activeCount++;
        else if (s === 'paused') pausedCount++;
        else if (s === 'expired') expiredCount++;
        else if (s === 'pending') pendingCount++;
      });

      const summary = { activeCount, pausedCount, expiredCount, pendingCount };

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
        endIndex: startIndex + pageRows.length,
      };
    }),
  );

  ngOnInit(): void {
    // read query params -> handle list/detail/edit
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qm) => {
      const id = qm.get('id');
      const isEdit = qm.get('edit') === 'true';
      const isCreate = qm.get('create') === 'true';

      if (isCreate) {
        this.mode = 'create';
        this.selectedId = null;
        this.detail = null;
        this.editModel = null;
        if (!this.createModel) {
          this.initCreateModel();
          this.createStep = 1;
        }
        return;
      }

      if (!id) {
        this.mode = 'list';
        this.selectedId = null;
        this.detail = null;
        this.editModel = null;
        this.createModel = null;
        this.createStep = 1;
        return;
      }

      this.selectedId = id;
      const found = this.repo.getSnapshot().find((x) => x.voucher_id === id);

      if (!found) {
        // Fallback or alert if id not found
        this.backToList();
        return;
      }

      this.detail = this.toRowVM(found, 0);

      if (isEdit) {
        this.mode = 'edit';
        // Initialize editModel if not already set or if it's a new ID
        if (!this.editModel || this.selectedId !== id) {
          this.initEditModel(this.detail);
        }
      } else {
        this.mode = 'detail';
        this.editModel = null;
      }
    });
  }

  private initEditModel(d: VoucherRowVM) {
    this.editModel = {
      value: d.value,
      min_order_value: d.min_order_value,
      usage_limit: d.usage_limit,
      start_date: d.start_date,
      end_date: d.end_date,
      appliedTo: d.appliedTo || 'all',
      applied_products_text: (d.applied_products || []).join(', '),
    };
  }

  private initCreateModel() {
    this.createModel = {
      code: '',
      voucher_name: '',
      type: 'percent',
      value: 0,
      min_order_value: 0,
      usage_limit: 0,
      start_date: this.todayISO,
      end_date: this.todayISO,
      description: '',
      appliedTo: 'all',
      applied_products_text: '',
    };
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

  openEdit(id: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id, edit: 'true' },
      queryParamsHandling: 'merge',
    });
  }

  openCreate() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { create: 'true', id: null, edit: null },
      queryParamsHandling: 'merge',
    });
  }

  backToList() {
    // If in edit mode and has changes, ask before going back
    if ((this.mode === 'edit' || this.mode === 'create') && this.isDirty()) {
      this.discardModalOpen = true;
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null, edit: null, create: null },
      queryParamsHandling: 'merge',
    });
  }

  backToDetail() {
    if (this.mode === 'edit' && this.isDirty()) {
      this.discardModalOpen = true;
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: null, create: null },
      queryParamsHandling: 'merge',
    });
  }

  isDirty(): boolean {
    if (this.mode === 'create') {
      if (!this.createModel) return false;
      return (
        this.createModel.code !== '' ||
        this.createModel.voucher_name !== '' ||
        this.createModel.value !== 0
      );
    }

    if (!this.editModel || !this.detail) return false;
    const currentText = (this.detail.applied_products || []).join(', ');
    return (
      this.editModel.value !== this.detail.value ||
      this.editModel.min_order_value !== this.detail.min_order_value ||
      this.editModel.usage_limit !== this.detail.usage_limit ||
      this.editModel.start_date !== this.detail.start_date ||
      this.editModel.end_date !== this.detail.end_date ||
      this.editModel.appliedTo !== this.detail.appliedTo ||
      this.editModel.applied_products_text !== currentText
    );
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
    if (!this.selectedId) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: 'true' },
      queryParamsHandling: 'merge',
    });
  }

  cancelEdit() {
    this.backToDetail();
  }

  onConfirmDiscard() {
    this.discardModalOpen = false;
    // Actually navigate away from edit/create
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: null, create: null },
      queryParamsHandling: 'merge',
    });
  }

  onCancelDiscard() {
    this.discardModalOpen = false;
  }

  saveEdit() {
    if (!this.detail || !this.editModel) return;

    if (this.editModel.end_date < this.editModel.start_date) {
      this.showAlert('Lỗi thời gian', 'Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    this.saveModalOpen = true;
  }

  showAlert(title: string, message: string) {
    this.alertModalTitle = title;
    this.alertModalMessage = message;
    this.alertModalOpen = true;
  }

  closeAlert() {
    this.alertModalOpen = false;
  }

  onCancelSave() {
    this.saveModalOpen = false;
  }

  executeSave() {
    if (this.mode === 'create') {
      if (!this.createModel) return;
      const newId = 'V' + Math.floor(Math.random() * 10000).toString();

      this.repo.create({
        voucher_id: newId,
        code: this.createModel.code.toUpperCase(),
        voucher_name: this.createModel.voucher_name,
        type: this.createModel.type,
        value: Number(this.createModel.value) || 0,
        min_order_value: Number(this.createModel.min_order_value) || 0,
        usage_limit: Number(this.createModel.usage_limit) || 0,
        used_count: 0,
        start_date: this.createModel.start_date,
        end_date: this.createModel.end_date,
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
        description: this.createModel.description,
        appliedTo: this.createModel.appliedTo,
        applied_products: this.createModel.applied_products_text
          ? this.createModel.applied_products_text.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { create: null, id: newId },
        queryParamsHandling: 'merge',
      });
      this.saveModalOpen = false;
      return;
    }

    if (!this.detail || !this.editModel) return;

    const id = this.detail.voucher_id;
    this.repo.update(id, {
      value: Number(this.editModel.value) || 0,
      min_order_value: Number(this.editModel.min_order_value) || 0,
      usage_limit: Number(this.editModel.usage_limit) || 0,
      start_date: this.editModel.start_date,
      end_date: this.editModel.end_date,
      appliedTo: this.editModel.appliedTo,
      applied_products: this.editModel.applied_products_text
        ? this.editModel.applied_products_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : [],
    });

    // refresh detail
    const fresh = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (fresh) this.detail = this.toRowVM(fresh, this.detail.stt);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: null },
      queryParamsHandling: 'merge',
    });
    this.saveModalOpen = false;
  }

  executeCreateAction() {
    if (!this.createModel) return;

    if (!this.createModel.code || !this.createModel.voucher_name) {
      this.showAlert('Thông tin bắt buộc', 'Vui lòng nhập Mã Voucher và Tên Chương trình!');
      return;
    }

    if (this.createModel.end_date < this.createModel.start_date) {
      this.showAlert('Lỗi thời gian', 'Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    this.saveModalOpen = true;
  }

  nextCreateStep() {
    if (!this.createModel) return;
    if (!this.createModel.code || !this.createModel.voucher_name) {
      this.showAlert('Thông tin bắt buộc', 'Vui lòng nhập Mã Voucher và Tên Chương trình trước khi tiếp tục!');
      return;
    }
    if (this.createModel.end_date < this.createModel.start_date) {
      this.showAlert('Lỗi thời gian', 'Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }
    this.createStep = 2;
  }

  prevCreateStep() {
    this.createStep = 1;
  }

  // ====== ACTIONS ======
  toggleActivePaused(id: string) {
    const v = this.repo.getSnapshot().find((x) => x.voucher_id === id);
    if (!v) return;

    const computed = this.computeStatus(v);
    if (computed === 'expired' || computed === 'pending') return;

    const next: VoucherStatus = v.status === 'paused' ? 'active' : 'paused';
    this.repo.update(id, { status: next });
    this.refreshDetailIfOpen(id);
  }

  hardDelete(id: string) {
    this.deleteVoucherId = id;
    this.deleteModalTitle = 'Xác nhận xóa Voucher';
    this.deleteModalMessage = `Hệ thống sẽ xóa vĩnh viễn voucher này. Dữ liệu sẽ không thể khôi phục. Tiếp tục?`;
    this.deleteModalOpen = true;
  }

  onConfirmDelete() {
    if (!this.deleteVoucherId) return;

    this.repo.deleteHard(this.deleteVoucherId);

    if (this.selectedId === this.deleteVoucherId) {
      this.backToList();
    }

    this.deleteModalOpen = false;
    this.deleteVoucherId = null;
  }

  onCancelDelete() {
    this.deleteModalOpen = false;
    this.deleteVoucherId = null;
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
      case 'expired':
        return 'Hết hạn';
      case 'pending':
        return 'Chưa publish';
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
      case 'expired':
        return 'hb-st-expired';
      case 'pending':
        return 'hb-st-pending';
      default:
        return '';
    }
  }

  // ====== HELPERS ======
  private computeStatus(v: Voucher): VoucherStatus {
    const now = this.toISODateTime(new Date());

    // Check if hasn't started yet
    if (v.start_date && v.start_date > now) return 'pending';

    // String compare works for yyyy-MM-ddTHH:mm format
    if (v.end_date && v.end_date < now) return 'expired';

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

    const revenueText = (v.revenue_generated || 0).toLocaleString('vi-VN') + 'đ';
    const appliedToText =
      v.appliedTo === 'specific'
        ? `Sản phẩm chỉ định (${(v.applied_products || []).length})`
        : 'Tất cả sản phẩm';

    return {
      ...v,
      revenueText,
      computed_status: computed,
      valueText,
      minOrderText: `${v.min_order_value.toLocaleString()}đ`,
      remaining: Math.max(0, v.usage_limit - v.used_count),
      typeLabel,
      stt,
      startDateText: this.fmtISODateNoTime(v.start_date),
      endDateText: this.fmtISODateNoTime(v.end_date),
      appliedToText,
    };
  }

  fmtISODate(iso: string): string {
    if (!iso) return '—';
    // iso is yyyy-mm-ddThh:mm
    const [datePart, timePart] = iso.split('T');
    if (!datePart) return iso;
    const dateParts = datePart.split('-');
    if (dateParts.length !== 3) return iso;
    return `${timePart || '00:00'} - ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }

  fmtISODateNoTime(iso: string): string {
    if (!iso) return '—';
    const [datePart] = iso.split('T');
    if (!datePart) return iso;
    const dateParts = datePart.split('-');
    if (dateParts.length !== 3) return iso;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }

  private toISODateTime(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
  }
}
