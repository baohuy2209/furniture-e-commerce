import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, map, takeUntil, of, catchError, switchMap } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { AdminVoucherService } from '../../../services/admin-voucher.service';

// =====================
// Domain model (MongoDB-friendly)
// =====================

type VoucherStatus = 'active' | 'paused' | 'expired' | 'pending';
type VoucherType = 'percent' | 'fixed' | 'freeship';

interface Voucher {
  _id: string; // MongoDB ID
  code: string;
  voucher_name: string;
  type: VoucherType;
  value: number;
  min_order_value: number;
  usage_limit: number;
  used_count: number;
  start_date: string; // ISO format
  end_date: string; // ISO format
  status: VoucherStatus;
  createdAt: string;
  updatedAt: string;
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
    private voucherService: AdminVoucherService,
  ) {}

  // ====== MODE / SELECTION ======
  mode: PageMode = 'list';
  selectedId: string | null = null;
  detail: VoucherRowVM | null = null;

  // ====== EDIT MODEL ======
  editModel: {
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

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  // convenience getters for template bindings (ngModel)
  get q() { return this.state$.value.q; }
  set q(v: string) { this.patchState({ q: v ?? '' }); }

  get f_status() { return this.state$.value.f_status; }
  set f_status(v: '' | VoucherStatus) { this.patchState({ f_status: v ?? '', page: 1 }); }

  get f_type() { return this.state$.value.f_type; }
  set f_type(v: '' | VoucherType) { this.patchState({ f_type: v ?? '', page: 1 }); }

  get pageSize() { return this.state$.value.pageSize; }
  set pageSize(v: number) { this.patchState({ pageSize: Number(v) || 10, page: 1 }); }

  get sortKey() { return this.state$.value.sortKey; }
  get sortDir() { return this.state$.value.sortDir; }

  readonly vm$ = combineLatest([this.state$, this.refresh$]).pipe(
    switchMap(([st]) => {
      const params = {
        page: st.page,
        size: st.pageSize,
        q: st.q,
        status: st.f_status,
        type: st.f_type,
        sortKey: st.sortKey,
        sortDir: st.sortDir,
      };
      return this.voucherService.getVouchers(params).pipe(
        map((res: any) => {
          const data = res.data;
          
          const rows = (data.vouchers || []).map((v: any, i: number) =>
            this.toRowVM(v, (st.page - 1) * st.pageSize + i + 1),
          );
          return {
            rows,
            total: data.totalItems,
            page: data.currentPage,
            totalPages: data.totalPages,
            summary: data.summary || {
              activeCount: 0,
              pausedCount: 0,
              expiredCount: 0,
              pendingCount: 0,
            },
            startIndex: rows.length > 0 ? (st.page - 1) * st.pageSize + 1 : 0,
            endIndex: (st.page - 1) * st.pageSize + rows.length,
          };
        }),
        catchError((err) => {
          console.error(err);
          return of({
            rows: [],
            total: 0,
            page: 1,
            totalPages: 1,
            summary: { activeCount: 0, pausedCount: 0, expiredCount: 0, pendingCount: 0 },
            startIndex: 0,
            endIndex: 0,
          });
        }),
      );
    }),
  );

  ngOnInit(): void {
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

      if (this.selectedId !== id) {
        this.selectedId = id;
        this.loadDetail(id, isEdit);
      } else if (isEdit && !this.editModel && this.detail) {
        this.initEditModel(this.detail!);
        this.mode = 'edit';
      } else if (!isEdit) {
        this.mode = 'detail';
        this.editModel = null;
      }
    });
  }

  private loadDetail(id: string, isEdit: boolean) {
    this.voucherService.getVoucher(id).subscribe({
      next: (res) => {
        const v = res.data;
        this.detail = this.toRowVM(v, 0);
        if (isEdit) {
          this.mode = 'edit';
          this.initEditModel(this.detail!);
        } else {
          this.mode = 'detail';
        }
      },
      error: (err) => {
        console.error(err);
        this.backToList();
      },
    });
  }

  private initEditModel(d: VoucherRowVM) {
    this.editModel = {
      voucher_name: d.voucher_name,
      type: d.type,
      value: d.value,
      min_order_value: d.min_order_value,
      usage_limit: d.usage_limit,
      start_date: this.ensureDateTimeFormat(d.start_date),
      end_date: this.ensureDateTimeFormat(d.end_date),
      appliedTo: d.appliedTo || 'all',
      applied_products_text: (d.applied_products || []).join(', '),
      description: d.description || '',
    };
  }

  private ensureDateTimeFormat(iso: string): string {
    if (!iso) return this.todayISO;
    if (iso.includes('T')) return iso.substring(0, 16);
    return iso;
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
      return this.createModel.code !== '' || this.createModel.voucher_name !== '' || this.createModel.value !== 0;
    }
    if (!this.editModel || !this.detail) return false;
    const currentText = (this.detail.applied_products || []).join(', ');
    return (
      this.editModel.value !== this.detail.value ||
      this.editModel.min_order_value !== this.detail.min_order_value ||
      this.editModel.usage_limit !== this.detail.usage_limit ||
      this.editModel.start_date !== this.ensureDateTimeFormat(this.detail.start_date) ||
      this.editModel.end_date !== this.ensureDateTimeFormat(this.detail.end_date) ||
      this.editModel.appliedTo !== this.detail.appliedTo ||
      this.editModel.applied_products_text !== currentText ||
      this.editModel.description !== (this.detail.description || '') ||
      this.editModel.voucher_name !== this.detail.voucher_name
    );
  }

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

  onChangeQ(v: string) { this.patchState({ q: v ?? '', page: 1 }); }
  onChangeStatus(v: '' | VoucherStatus) { this.patchState({ f_status: v ?? '', page: 1 }); }
  onChangeType(v: '' | VoucherType) { this.patchState({ f_type: v ?? '', page: 1 }); }
  onChangePageSize(v: number) { this.patchState({ pageSize: Number(v) || 10, page: 1 }); }

  toggleSort(key: keyof Voucher) {
    const st = this.state$.value;
    if (st.sortKey === key) {
      this.patchState({ sortDir: st.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.patchState({ sortKey: key, sortDir: 'asc' });
    }
  }

  sortIcon(key: keyof Voucher): string {
    const st = this.state$.value;
    if (st.sortKey !== key) return 'fa-sort';
    return st.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  setPage(p: number) { this.patchState({ page: Math.max(1, Math.floor(p)) }); }

  private patchState(partial: Partial<UIState>) {
    this.state$.next({ ...this.state$.value, ...partial });
  }

  enterEdit() {
    if (!this.selectedId) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: 'true' },
      queryParamsHandling: 'merge',
    });
  }

  cancelEdit() { this.backToDetail(); }

  onConfirmDiscard() {
    this.discardModalOpen = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: null, create: null },
      queryParamsHandling: 'merge',
    });
  }

  onCancelDiscard() { this.discardModalOpen = false; }

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

  closeAlert() { this.alertModalOpen = false; }
  onCancelSave() { this.saveModalOpen = false; }

  executeSave() {
    if (this.mode === 'create') {
      if (!this.createModel) return;
      const payload = {
        code: this.createModel.code.toUpperCase(),
        voucher_name: this.createModel.voucher_name,
        type: this.createModel.type,
        value: Number(this.createModel.value) || 0,
        min_order_value: Number(this.createModel.min_order_value) || 0,
        usage_limit: Number(this.createModel.usage_limit) || 0,
        start_date: this.createModel.start_date,
        end_date: this.createModel.end_date,
        description: this.createModel.description,
        appliedTo: this.createModel.appliedTo,
        applied_products: this.createModel.applied_products_text
          ? this.createModel.applied_products_text.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      console.log('[VOUCHER] Sending create request:', payload);
      this.saveModalOpen = false; // Close modal immediately

      this.voucherService.createVoucher(payload).subscribe({
        next: (res) => {
          console.log('[VOUCHER] Create success:', res);
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { create: null, id: res.data._id },
            queryParamsHandling: 'merge',
          });
          this.refresh$.next();
        },
        error: (err) => {
          console.error('[VOUCHER] Create error:', err);
          this.showAlert('Lỗi khi tạo Voucher', err.message || 'Không thể kết nối đến máy chủ.');
        },
      });
      return;
    }

    if (!this.detail || !this.editModel) return;
    const id = this.detail._id;

    const payload = {
      voucher_name: this.editModel.voucher_name,
      type: this.editModel.type,
      value: Number(this.editModel.value) || 0,
      min_order_value: Number(this.editModel.min_order_value) || 0,
      usage_limit: Number(this.editModel.usage_limit) || 0,
      start_date: this.editModel.start_date,
      end_date: this.editModel.end_date,
      description: this.editModel.description,
      appliedTo: this.editModel.appliedTo,
      applied_products: this.editModel.applied_products_text
        ? this.editModel.applied_products_text.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    };

    console.log('[VOUCHER] Sending update request:', payload);
    this.saveModalOpen = false;

    this.voucherService.updateVoucher(id, payload).subscribe({
      next: (res) => {
        console.log('[VOUCHER] Update success:', res);
        this.detail = this.toRowVM(res.data, 0);
        this.mode = 'detail';
        this.refresh$.next();
      },
      error: (err) => {
        console.error('[VOUCHER] Update error:', err);
        this.showAlert('Lỗi khi cập nhật', err.message || 'Lỗi không xác định.');
      },
    });
  }

  executeCreateAction() {
    if (!this.createModel) return;
    if (!this.createModel.code || !this.createModel.voucher_name) {
      this.showAlert('Thông tin bắt buộc', 'Vui lòng nhập Mã Voucher và Tên Chương trình!');
      return;
    }
    this.saveModalOpen = true;
  }

  nextCreateStep() {
    if (!this.createModel) return;
    if (!this.createModel.code || !this.createModel.voucher_name) {
      this.showAlert('Thông tin bắt buộc', 'Vui lòng nhập Mã Voucher và Tên Chương trình!');
      return;
    }
    this.createStep = 2;
  }

  prevCreateStep() { this.createStep = 1; }

  toggleActivePaused(id: string) {
    this.voucherService.toggleVoucher(id).subscribe({
      next: (res) => {
        if (this.selectedId === id) {
          this.detail = this.toRowVM(res.data, this.detail?.stt || 0);
        }
        this.refresh$.next();
      },
      error: (err) => this.showAlert('Lỗi', err.message),
    });
  }

  hardDelete(id: string) {
    this.deleteVoucherId = id;
    this.deleteModalTitle = 'Xác nhận xóa Voucher';
    this.deleteModalMessage = 'Hệ thống sẽ xóa vĩnh viễn voucher này. Dữ liệu sẽ không thể khôi phục. Tiếp tục?';
    this.deleteModalOpen = true;
  }

  onConfirmDelete() {
    if (!this.deleteVoucherId) return;
    this.voucherService.deleteVoucher(this.deleteVoucherId).subscribe({
      next: () => {
        if (this.selectedId === this.deleteVoucherId) this.backToList();
        this.refresh$.next();
        this.deleteModalOpen = false;
        this.deleteVoucherId = null;
      },
      error: (err) => this.showAlert('Lỗi', err.message),
    });
  }

  onCancelDelete() { this.deleteModalOpen = false; }

  trackByVoucher(index: number, item: VoucherRowVM): string {
    return item._id;
  }

  statusBadgeClass(status: string | null | undefined): string {
    if (!status) return 'hb-badge-secondary';
    switch (status) {
      case 'active': return 'hb-badge-success';
      case 'paused': return 'hb-badge-warning';
      case 'expired': return 'hb-badge-danger';
      case 'pending': return 'hb-badge-info';
      default: return 'hb-badge-secondary';
    }
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return '—';
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'paused': return 'Đang tạm dừng';
      case 'expired': return 'Đã hết hạn';
      case 'pending': return 'Chờ kích hoạt';
      default: return status;
    }
  }

  exportCsvSnapshot() {
    this.showAlert('Tính năng', 'Tính năng Xuất CSV đang được phát triển và sẽ sớm ra mắt.');
  }

  private toRowVM(v: Voucher, stt: number): VoucherRowVM {
    const computed = this.computeStatus(v);
    const valueText = v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${v.value.toLocaleString()}đ` : 'Free ship';
    const typeLabel = v.type === 'percent' ? 'Giảm %' : v.type === 'fixed' ? 'Giảm tiền' : 'Free ship';
    return {
      ...v,
      computed_status: computed,
      valueText,
      revenueText: (v.revenue_generated || 0).toLocaleString('vi-VN') + 'đ',
      minOrderText: `${v.min_order_value.toLocaleString()}đ`,
      remaining: Math.max(0, v.usage_limit - v.used_count),
      typeLabel,
      stt,
      startDateText: this.fmtISODateNoTime(v.start_date),
      endDateText: this.fmtISODateNoTime(v.end_date),
      appliedToText: v.appliedTo === 'specific' ? `Sản phẩm chỉ định (${(v.applied_products || []).length})` : 'Tất cả sản phẩm',
    };
  }

  private computeStatus(v: Voucher): VoucherStatus {
    const now = new Date();
    const start = new Date(v.start_date);
    const end = new Date(v.end_date);
    if (v.status === 'paused') return 'paused';
    if (now < start) return 'pending';
    if (now > end) return 'expired';
    return v.status;
  }

  fmtISODate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN');
  }

  fmtISODateNoTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  }

  private toISODateTime(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
