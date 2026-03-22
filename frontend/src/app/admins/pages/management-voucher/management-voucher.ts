import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, lastValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

// =====================
// Domain model
// =====================

type VoucherStatus = 'active' | 'paused' | 'expired' | 'pending';
type VoucherType = 'percent' | 'fixed' | 'freeship';

interface Voucher {
  _id?: string;
  voucher_id: string;
  code: string;
  voucher_name: string;
  type: VoucherType;
  value: number;
  min_order_value: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: VoucherStatus;
  created_at: string;
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
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal, HttpClientModule],
  templateUrl: './management-voucher.html',
  styleUrls: ['./management-voucher.css'],
})
export class ManagementVoucher implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly vouchers$ = new BehaviorSubject<Voucher[]>([]);
  private readonly summary$ = new BehaviorSubject<any>({
    activeCount: 0, pausedCount: 0, expiredCount: 0, pendingCount: 0
  });

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

  createStep: 1 | 2 = 1;
  saveModalOpen = false;
  discardModalOpen = false;
  deleteModalOpen = false;
  deleteModalTitle = 'Xác nhận xóa Voucher';
  deleteModalMessage = 'Bạn có chắc chắn muốn xóa voucher này? Hành động này không thể hoàn tác.';
  deleteVoucherId: string | null = null;
  alertModalOpen = false;
  alertModalTitle = '';
  alertModalMessage = '';
  todayISO = this.toDateTimeLocal(new Date());

  private readonly state$ = new BehaviorSubject<UIState>({
    q: '',
    f_status: '',
    f_type: '',
    pageSize: 10,
    page: 1,
    sortKey: 'created_at',
    sortDir: 'desc',
  });

  get q() { return this.state$.value.q; }
  set q(v: string) { this.patchState({ q: v ?? '' }); }

  get f_status() { return this.state$.value.f_status; }
  set f_status(v: '' | VoucherStatus) { this.patchState({ f_status: v ?? '' }); }

  get f_type() { return this.state$.value.f_type; }
  set f_type(v: '' | VoucherType) { this.patchState({ f_type: v ?? '' }); }

  get pageSize() { return this.state$.value.pageSize; }
  set pageSize(v: number) { this.patchState({ pageSize: Number(v) || 10 }); }

  get sortKey() { return this.state$.value.sortKey; }
  get sortDir() { return this.state$.value.sortDir; }

  readonly vm$ = combineLatest([this.vouchers$, this.summary$, this.state$]).pipe(
    map(([data, summary, st]) => {
      if (!st) return { rows: [], total: 0, page: 1, totalPages: 1, summary, startIndex: 1, endIndex: 0 };
      let rows = [...data];
      const keyword = (st.q || '').trim().toLowerCase();
      if (keyword) {
        rows = rows.filter(v => 
          v.code.toLowerCase().includes(keyword) || 
          v.voucher_name.toLowerCase().includes(keyword)
        );
      }
      if (st.f_status) rows = rows.filter(v => this.computeStatus(v) === st.f_status);
      if (st.f_type) rows = rows.filter(v => v.type === st.f_type);

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
    })
  );

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qm => {
      const id = qm.get('id');
      const isEdit = qm.get('edit') === 'true';
      const isCreate = qm.get('create') === 'true';

      if (isCreate) {
        this.mode = 'create';
        this.selectedId = null;
        this.detail = null;
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
        this.createModel = null;
        return;
      }

      this.selectedId = id;
      const found = this.vouchers$.value.find(x =>
        x._id === id || x.voucher_id === id || (x as any)._id?.toString() === id
      );
      if (!found) {
        // Vouchers might not be loaded yet — retry once
        setTimeout(() => {
          const retry = this.vouchers$.value.find(x =>
            x._id === id || x.voucher_id === id || (x as any)._id?.toString() === id
          );
          if (retry) {
            this.detail = this.toRowVM(retry, 0);
            this.selectedId = id;
            this.mode = isEdit ? 'edit' : 'detail';
            if (isEdit) this.initEditModel(this.detail!);
          } else {
            this.backToList();
          }
        }, 500);
        return;
      }

      this.detail = this.toRowVM(found, 0);
      if (isEdit) {
        this.mode = 'edit';
        if (!this.editModel || this.selectedId !== id) {
          this.initEditModel(this.detail);
        }
      } else {
        this.mode = 'detail';
        this.editModel = null;
      }
    });
  }

  private loadData() {
    this.http.get<any>('http://localhost:3000/api/admin/vouchers')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Normalize: map _id → voucher_id so routing always works
            const normalized = (res.data.vouchers || []).map((v: any) => ({
              ...v,
              voucher_id: v.voucher_id || v._id?.toString() || '',
            }));
            this.vouchers$.next(normalized);
            this.summary$.next(res.data.summary || {
                activeCount: 0, pausedCount: 0, expiredCount: 0, pendingCount: 0
            });
          }
        }
      });
  }

  private initEditModel(d: VoucherRowVM) {
    this.editModel = {
      value: d.value,
      min_order_value: d.min_order_value,
      usage_limit: d.usage_limit,
      start_date: this.toDateTimeLocal(d.start_date),
      end_date: this.toDateTimeLocal(d.end_date),
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

  // ====== ACTIONS ======
  stopEvent(e: Event) { e.stopPropagation(); }

  openDetail(id: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { id }, queryParamsHandling: 'merge' });
  }

  openEdit(id: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { id, edit: 'true' }, queryParamsHandling: 'merge' });
  }

  openCreate() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { create: 'true', id: null, edit: null }, queryParamsHandling: 'merge' });
  }

  backToList() {
    if ((this.mode === 'edit' || this.mode === 'create') && this.isDirty()) {
      this.discardModalOpen = true;
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: null, edit: null, create: null }, queryParamsHandling: 'merge' });
  }

  backToDetail() {
    if (this.mode === 'edit' && this.isDirty()) {
      this.discardModalOpen = true;
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: { edit: null, create: null }, queryParamsHandling: 'merge' });
  }

  isDirty(): boolean {
    if (this.mode === 'create') {
      if (!this.createModel) return false;
      return this.createModel.code !== '' || this.createModel.voucher_name !== '';
    }
    if (!this.editModel || !this.detail) return false;
    return this.editModel.value !== this.detail.value || this.editModel.usage_limit !== this.detail.usage_limit;
  }

  resetFilters() {
    this.patchState({ q: '', f_status: '', f_type: '', page: 1 });
  }

  patchState(partial: Partial<UIState>) {
    this.state$.next({ ...this.state$.value, ...partial });
  }

  setPage(p: number) { this.patchState({ page: p }); }

  onChangeQ(v: string) { this.patchState({ q: v }); }
  onChangeStatus(v: any) { this.patchState({ f_status: v }); }
  onChangeType(v: any) { this.patchState({ f_type: v }); }
  onChangePageSize(v: number) { this.patchState({ pageSize: v }); }

  sortIcon(key: keyof Voucher): string {
    const st = this.state$.value;
    if (st.sortKey !== key) return 'fa-sort';
    return st.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  toggleSort(key: keyof Voucher) {
    const st = this.state$.value;
    if (st.sortKey === key) {
      this.patchState({ sortDir: st.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.patchState({ sortKey: key, sortDir: 'asc' });
    }
  }

  async executeSave() {
    if (this.mode === 'create') {
      if (!this.createModel) return;
      const payload = {
        ...this.createModel,
        applied_products: this.createModel.applied_products_text.split(',').map(s => s.trim()).filter(Boolean)
      };
      try {
        const res = await lastValueFrom(this.http.post<any>('http://localhost:3000/api/admin/vouchers', payload));
        this.loadData();
        this.router.navigate([], { relativeTo: this.route, queryParams: { create: null, id: res.data._id }, queryParamsHandling: 'merge' });
        this.saveModalOpen = false;
      } catch (err: any) { this.showAlert('Lỗi', err.message); }
      return;
    }
    if (!this.detail || !this.editModel) return;
    const id = (this.detail as any)._id?.toString() || this.detail.voucher_id;
    const payload = {
      ...this.editModel,
      applied_products: this.editModel.applied_products_text.split(',').map(s => s.trim()).filter(Boolean)
    };
    try {
      await lastValueFrom(this.http.put(`http://localhost:3000/api/admin/vouchers/${id}`, payload));
      this.loadData();
      this.router.navigate([], { relativeTo: this.route, queryParams: { edit: null }, queryParamsHandling: 'merge' });
      this.saveModalOpen = false;
    } catch (err: any) { this.showAlert('Lỗi', err.message); }
  }

  async toggleActivePaused(id: string) {
    try {
      await lastValueFrom(this.http.patch(`http://localhost:3000/api/admin/vouchers/${id}/toggle`, {}));
      this.loadData();
    } catch (err: any) { this.showAlert('Lỗi', err.message); }
  }

  async onConfirmDelete() {
    if (!this.deleteVoucherId) return;
    try {
      await lastValueFrom(this.http.delete(`http://localhost:3000/api/admin/vouchers/${this.deleteVoucherId}`));
      this.loadData();
      if (this.selectedId === this.deleteVoucherId) this.backToList();
    } catch (err: any) { this.showAlert('Lỗi', err.message); }
    this.deleteModalOpen = false;
  }

  // ====== UI HELPERS ======
  showAlert(title: string, message: string) {
    this.alertModalTitle = title; this.alertModalMessage = message; this.alertModalOpen = true;
  }

  private computeStatus(v: Voucher): VoucherStatus {
    const now = this.toDateTimeLocal(new Date());
    if (v.start_date && v.start_date > now) return 'pending';
    if (v.end_date && v.end_date < now) return 'expired';
    return v.status;
  }

  private toRowVM(v: Voucher, stt: number): VoucherRowVM {
    const computed = this.computeStatus(v);
    const vid = v.voucher_id || (v as any)._id?.toString() || '';
    return {
      ...v,
      voucher_id: vid,
      computed_status: computed,
      valueText: v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${(v.value || 0).toLocaleString()}đ` : 'Free ship',
      revenueText: ((v.revenue_generated || 0)).toLocaleString() + 'đ',
      minOrderText: `${(v.min_order_value || 0).toLocaleString()}đ`,
      remaining: Math.max(0, (v.usage_limit || 0) - (v.used_count || 0)),
      typeLabel: v.type === 'percent' ? 'Giảm %' : v.type === 'fixed' ? 'Giảm tiền' : 'Free ship',
      stt,
      startDateText: this.fmtISOTocustom(v.start_date),
      endDateText: this.fmtISOTocustom(v.end_date),
      appliedToText: v.appliedTo === 'specific' ? `Chỉ định (${(v.applied_products || []).length})` : 'Tất cả',
    };
  }

  fmtISODate(iso: any): string {
    return this.fmtISOTocustom(iso);
  }

  fmtISOTocustom(iso: any): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private toDateTimeLocal(iso: any): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
  }

  // STUBS for methods still in template
  onCancelSave() { this.saveModalOpen = false; }
  onCancelDiscard() { this.discardModalOpen = false; }
  onConfirmDiscard() { 
    this.discardModalOpen = false; 
    this.router.navigate([], { relativeTo: this.route, queryParams: { edit: null, create: null }, queryParamsHandling: 'merge' });
  }
  onCancelDelete() { this.deleteModalOpen = false; }
  enterEdit() { if (this.selectedId) this.openEdit(this.selectedId); }
  cancelEdit() { this.backToDetail(); }
  nextCreateStep() { this.createStep = 2; }
  prevCreateStep() { this.createStep = 1; }
  executeCreateAction() { this.saveModalOpen = true; }
  saveEdit() { this.saveModalOpen = true; }
  hardDelete(id: string) { this.deleteVoucherId = id; this.deleteModalOpen = true; }
  exportCsvSnapshot() { console.log('Export CSV stub'); }
  closeAlert() { this.alertModalOpen = false; }
  statusLabel(s: VoucherStatus): string {
    const maps: any = { active: 'Hoạt động', paused: 'Tạm dừng', expired: 'Hết hạn', pending: 'Chờ duyệt' };
    return maps[s] || s;
  }
  statusBadgeClass(s: VoucherStatus): string { return 'hb-st-' + s; }
}
