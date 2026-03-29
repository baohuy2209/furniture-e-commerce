import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil, finalize } from 'rxjs';
import { ConfirmModal, ConfirmModalType } from '../../components/confirm-modal/confirm-modal';
import { WarrantyService } from '../../../services/warranty-service';
import { IUser, IWarrantyRequest } from '../../../../interface';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';
type PageMode = 'list' | 'detail';
type WarrantyStatus = 'unresolved' | 'resolved' | 'rejected';

type WarrantyPopulated = Omit<IWarrantyRequest, 'user_id'> & {
  user_id: IUser;
  images?: string[];
};

interface ListRowVM {
  id: string;
  status: WarrantyStatus;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  issue_description: string;
  request_date: Date;
  resolution_note: string;
  approved_by: string;
  stt: number;
}

interface ListQuery {
  q: string;
  status: 'all' | WarrantyStatus;
  dateFrom: string;
  dateTo: string;
  sortKey: keyof ListRowVM;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

interface StatusOption {
  value: WarrantyStatus;
  label: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-management-warranty-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor, DatePipe, ConfirmModal],
  templateUrl: './management-warranty.html',
  styleUrls: ['./management-warranty.css'],
})
export class ManagementWarranty implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mode: PageMode = 'list';
  selectedId: string | null = null;

  // ── Loading states ───────────────────────────────────────────────────────
  loading = false; // loading danh sách
  detailLoading = false; // loading chi tiết
  saving = false;

  private requests$ = new BehaviorSubject<WarrantyPopulated[]>([]);

  /** Chi tiết đang xem — null khi chưa load xong */
  detail: WarrantyPopulated | null = null;

  exportRows: ListRowVM[] = [];

  // ── Inline edit ──────────────────────────────────────────────────────────
  editStatus: WarrantyStatus = 'unresolved';
  editResolutionNote = '';
  isDirty = false;

  // ── Modals ───────────────────────────────────────────────────────────────
  saveModalOpen = false;
  deleteModalOpen = false;
  deleteTargetId: string | null = null;
  advanceModalOpen = false;
  advanceTargetId: string | null = null;
  noticeModalOpen = false;
  noticeTitle = '';
  noticeMessage = '';
  noticeType: ConfirmModalType = 'info';

  statusOptions: StatusOption[] = [
    { value: 'unresolved', label: 'Chưa xử lý' },
    { value: 'resolved', label: 'Đã xử lý' },
    { value: 'rejected', label: 'Từ chối' },
  ];

  // ── Query ────────────────────────────────────────────────────────────────
  query$ = new BehaviorSubject<ListQuery>({
    q: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortKey: 'request_date',
    sortDir: 'desc',
    page: 1,
    pageSize: 10,
  });

  private rowsAll$ = this.requests$.pipe(map((items) => items.map((x) => toRowVM(x))));

  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      let filtered = rowsAll.slice();

      const q = (query.q || '').trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((r) =>
          `${r.id} ${r.customerName} ${r.customerPhone} ${r.customerEmail} ${r.issue_description}`
            .toLowerCase()
            .includes(q),
        );
      }

      if (query.status !== 'all') {
        filtered = filtered.filter((r) => r.status === query.status);
      }

      if (query.dateFrom) {
        const from = new Date(query.dateFrom + 'T00:00:00');
        filtered = filtered.filter((r) => r.request_date >= from);
      }

      if (query.dateTo) {
        const to = new Date(query.dateTo + 'T23:59:59');
        filtered = filtered.filter((r) => r.request_date <= to);
      }

      filtered.sort((a, b) => compareRow(a, b, query.sortKey, query.sortDir));
      this.exportRows = filtered.slice();

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = clamp(query.page, 1, totalPages);
      const start = (page - 1) * query.pageSize;

      const rows = filtered
        .slice(start, start + query.pageSize)
        .map((r, i) => ({ ...r, stt: start + i + 1 }));

      const unresolvedCount = this.requests$.value.filter(
        (r) => r.warranty_status === 'unresolved',
      ).length;

      const resolvedCount = this.requests$.value.filter(
        (r) => r.warranty_status === 'resolved',
      ).length;

      return {
        query: { ...query, page },
        rows,
        totalCount: rowsAll.length,
        total,
        totalPages,
        statusOptions: this.statusOptions,
        unresolvedCount,
        resolvedCount,
      };
    }),
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private warrantyService: WarrantyService,
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

  // ── Data ─────────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.loading = true;
    this.warrantyService
      .getAllWarranty()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => this.requests$.next((res.data as WarrantyPopulated[]) ?? []),
        error: () => this.requests$.next([]),
      });
  }

  /**
   * Load chi tiết một warranty.
   * Luôn reset detail = null trước khi gọi API
   * để template không render nội dung cũ trong lúc chờ.
   */
  private loadDetail(id: string): void {
    this.detail = null; // ← reset trước
    this.detailLoading = true;
    this.cdr.detectChanges();

    this.warrantyService
      .getDetailWarranty(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.detailLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          // getDetailWarranty trả về array, lấy phần tử đầu
          const raw = Array.isArray(res.data) ? res.data[0] : (res.data as any);
          if (raw) {
            this.detail = raw as WarrantyPopulated;
            this.initEditState(raw as WarrantyPopulated);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.detail = null;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Route ─────────────────────────────────────────────────────────────────
  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      if (!id) {
        this.selectedId = null;
        this.mode = 'list';
        this.detail = null;
        this.isDirty = false;
        return;
      }
      this.selectedId = id;
      this.mode = 'detail';
      this.loadDetail(id);
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

  // ── Edit state ────────────────────────────────────────────────────────────
  private initEditState(src: WarrantyPopulated): void {
    this.editStatus = (src.warranty_status as WarrantyStatus) ?? 'unresolved';
    this.editResolutionNote = src.resolution_note ?? '';
    this.isDirty = false;
  }

  markDirty(): void {
    this.isDirty = true;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveEdit(): void {
    if (!this.detail) return;
    this.saveModalOpen = true;
  }

  onCancelSave(): void {
    this.saveModalOpen = false;
  }

  showNotice(title: string, message: string, type: ConfirmModalType = 'info'): void {
    this.noticeTitle = title;
    this.noticeMessage = message;
    this.noticeType = type;
    this.noticeModalOpen = true;
    this.cdr.detectChanges();
  }

  executeSave(): void {
    if (!this.detail) {
      this.saveModalOpen = false;
      return;
    }
    this.saving = true;

    this.warrantyService
      .updateWarrantyStatus(this.detail._id, this.editStatus, this.editResolutionNote)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => {
          this.saveModalOpen = false;
          this.isDirty = false;
          this.showNotice('Thành công', 'Cập nhật trạng thái bảo hành thành công!', 'success');
          this.loadAll();
          this.loadDetail(this.detail!._id);
        },
        error: (err) => {
          this.saveModalOpen = false;
          this.showNotice('Lỗi hệ thống', 'Có lỗi xảy ra khi lưu thông tin: ' + (err.error?.message || err.message), 'danger');
        },
      });
  }

  // ── Advance (unresolved → resolved) ───────────────────────────────────────
  canAdvance(status: string): boolean {
    return status === 'unresolved';
  }

  advanceWithConfirm(id: string): void {
    this.advanceTargetId = id;
    this.advanceModalOpen = true;
  }

  onCancelAdvance(): void {
    this.advanceModalOpen = false;
    this.advanceTargetId = null;
  }

  onConfirmAdvance(): void {
    const id = this.advanceTargetId;
    this.advanceModalOpen = false;
    this.advanceTargetId = null;
    if (!id) return;

    this.warrantyService
      .updateWarrantyStatus(id, 'resolved', this.editResolutionNote)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAll();
          this.loadDetail(id);
        },
      });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteFromList(ev: MouseEvent, id: string): void {
    ev.stopPropagation();
    this.deleteTargetId = id;
    this.deleteModalOpen = true;
  }

  deleteRequest(id: string): void {
    this.deleteTargetId = id;
    this.deleteModalOpen = true;
  }

  onCancelDelete(): void {
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
  }

  onConfirmDelete(): void {
    const id = this.deleteTargetId;
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
    if (!id) return;

    this.warrantyService
      .deleteWarranty(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAll();
          if (this.selectedId === id) this.syncRoute(null, true);
        },
      });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  openDetail(id: string): void {
    this.syncRoute(id, true);
  }
  backToList(): void {
    this.syncRoute(null, true);
  }
  onHeaderBack(): void {
    this.backToList();
  }

  // ── Query / Filter ────────────────────────────────────────────────────────
  patchQuery(patch: Partial<ListQuery>): void {
    const next = { ...this.query$.value, ...patch };
    if (!('page' in patch)) next.page = 1;
    this.query$.next(next);
  }

  resetFilters(): void {
    this.query$.next({
      q: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      sortKey: 'request_date',
      sortDir: 'desc',
      page: 1,
      pageSize: 10,
    });
  }

  toggleSort(key: keyof ListRowVM): void {
    const q = this.query$.value;
    if (q.sortKey === key) {
      this.query$.next({ ...q, sortDir: q.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.query$.next({ ...q, sortKey: key, sortDir: 'asc' });
    }
  }

  sortIcon(key: keyof ListRowVM): string {
    if (this.query$.value.sortKey !== key) return 'fa-sort';
    return this.query$.value.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  goPage(page: number): void {
    this.query$.next({ ...this.query$.value, page });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  statusBadgeClass(status: string): string {
    switch (status) {
      case 'unresolved':
        return 'hb-st-checking';
      case 'resolved':
        return 'hb-st-approved';
      case 'rejected':
        return 'hb-st-rejected';
      default:
        return 'hb-st-new';
    }
  }

  getStatusLabel(status: string): string {
    return statusLabel(status as WarrantyStatus);
  }

  exportCsv(rows: ListRowVM[]): void {
    const header = [
      'id',
      'customerName',
      'customerPhone',
      'customerEmail',
      'issue_description',
      'status',
      'request_date',
      'resolution_note',
      'approved_by',
    ];
    const lines = rows.map((r) => [
      r.id,
      r.customerName,
      r.customerPhone,
      r.customerEmail,
      r.issue_description,
      r.status,
      r.request_date.toISOString(),
      r.resolution_note,
      r.approved_by,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((x) => csvEscape(String(x ?? ''))).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warranties_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function toRowVM(x: WarrantyPopulated): ListRowVM {
  return {
    id: x._id,
    status: (x.warranty_status as WarrantyStatus) ?? 'unresolved',
    statusLabel: statusLabel((x.warranty_status as WarrantyStatus) ?? 'unresolved'),
    customerName: x.user_id?.name ?? x.fullname,
    customerPhone: x.user_id?.phone ?? x.phone,
    customerEmail: x.user_id?.email ?? x.email,
    issue_description: x.issue_description,
    request_date: new Date(x.request_date),
    resolution_note: x.resolution_note ?? '',
    approved_by: x.approved_by ?? '',
    stt: 0,
  };
}

function statusLabel(s: WarrantyStatus): string {
  const map: Record<WarrantyStatus, string> = {
    unresolved: 'Chưa xử lý',
    resolved: 'Đã xử lý',
    rejected: 'Từ chối',
  };
  return map[s] ?? s;
}

function compareRow(a: ListRowVM, b: ListRowVM, key: keyof ListRowVM, dir: SortDir): number {
  const av: unknown = a[key];
  const bv: unknown = b[key];
  let cmp = 0;
  if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
  else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
  else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'vi', { numeric: true });
  return dir === 'asc' ? cmp : -cmp;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function csvEscape(s: string): string {
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
