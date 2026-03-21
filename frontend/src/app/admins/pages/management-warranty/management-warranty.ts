import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type PageMode = 'list' | 'detail' | 'edit';

type RequestType = 'warranty' | 'return';
type RequestStatus =
  | 'NEW'
  | 'RECEIVED'
  | 'CHECKING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED';

interface TimelineItem {
  at: string;
  title: string;
  note?: string;
}

interface WarrantyRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;

  orderId: string;
  customerName: string;
  customerPhone: string;

  productId: string;
  productName: string;
  variantLabel: string;

  supplier?: string;
  assignee?: string;

  reason: string;
  internalNote?: string;

  createdAt: string;
  updatedAt: string;
  expectedDoneAt: string;
  completedAt?: string;

  estimatedCost: number;
  attachments: string[];
  timeline: TimelineItem[];
}

type WarrantyRequestDetailVM = Omit<WarrantyRequest, 'createdAt' | 'expectedDoneAt'> & {
  createdAt: Date;
  expectedDoneAt: Date;
  typeLabel: string;
  statusLabel: string;
  slaLabel: string;
  resolutionHours: number | null;
};

interface ListRowVM {
  id: string;
  type: RequestType;
  status: RequestStatus;
  statusLabel: string;

  orderId: string;
  productName: string;
  variantLabel: string;

  customerName: string;
  customerPhone: string;

  supplier?: string;
  assignee?: string;

  stt: number;
  expectedDoneAt: Date;
  slaLabel: string;
}

interface ListQuery {
  q: string;
  type: 'all' | RequestType;
  status: 'all' | RequestStatus;
  supplier: string;
  dateFrom: string;
  dateTo: string;
  sortKey: keyof ListRowVM;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

interface StatusOption {
  value: RequestStatus;
  label: string;
}

interface EditForm {
  status: RequestStatus;
  assignee: string;
  supplier: string;
  expectedDoneDate: string;
  internalNote: string;
  estimatedCost: number;
  customerOutcome: '' | 'call' | 'email' | 'chat';
}

class WarrantyRequestRepository {
  private seed: WarrantyRequest[] = buildSeed();

  list(): WarrantyRequest[] {
    return this.seed.slice();
  }

  getById(id: string): WarrantyRequest | null {
    return this.seed.find((x) => x.id === id) ?? null;
  }

  update(id: string, patch: Partial<WarrantyRequest>): WarrantyRequest | null {
    const idx = this.seed.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    this.seed[idx] = {
      ...this.seed[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.seed[idx];
  }

  delete(id: string): boolean {
    const before = this.seed.length;
    this.seed = this.seed.filter((x) => x.id !== id);
    return this.seed.length !== before;
  }

  pushTimeline(id: string, item: TimelineItem): void {
    const req = this.getById(id);
    if (!req) return;
    req.timeline = [{ ...item }, ...req.timeline];
    req.updatedAt = new Date().toISOString();
  }
}

@Component({
  selector: 'app-management-warranty-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor, DatePipe, ConfirmModal],
  templateUrl: './management-warranty.html',
  styleUrls: ['./management-warranty.css'],
})
export class ManagementWarranty implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private repo = new WarrantyRequestRepository();

  mode: PageMode = 'list';
  selectedId: string | null = null;

  private requests$ = new BehaviorSubject<WarrantyRequest[]>([]);
  private routeState$ = new BehaviorSubject<{ id: string | null; edit: boolean }>({
    id: null,
    edit: false,
  });

  detail: WarrantyRequestDetailVM | null = null;
  editForm: EditForm | null = null;
  private originalSnapshot: EditForm | null = null;

  isDirty = false;
  saving = false;

  exportRows: ListRowVM[] = [];
  private pendingDiscardAction: (() => void) | null = null;

  saveModalOpen = false;
  discardModalOpen = false;
  deleteModalOpen = false;
  advanceModalOpen = false;

  deleteTargetId: string | null = null;
  advanceTargetId: string | null = null;

  statusOptions: StatusOption[] = [
    { value: 'NEW', label: 'Mới tạo' },
    { value: 'RECEIVED', label: 'Đã tiếp nhận' },
    { value: 'CHECKING', label: 'Đang kiểm tra' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'COMPLETED', label: 'Hoàn tất' },
  ];

  query$ = new BehaviorSubject<ListQuery>({
    q: '',
    type: 'all',
    status: 'all',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    sortKey: 'expectedDoneAt',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
  });

  private rowsAll$ = this.requests$.pipe(map((items) => items.map((x) => toRowVM(x))));

  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      let filtered = rowsAll.slice();
      const q = (query.q || '').trim().toLowerCase();

      if (q.length >= 1) {
        filtered = filtered.filter((r) => {
          const hay =
            `${r.id} ${r.orderId} ${r.customerName} ${r.customerPhone} ${r.productName} ${r.variantLabel} ${r.assignee ?? ''} ${r.supplier ?? ''}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (query.type !== 'all') {
        filtered = filtered.filter((r) => r.type === query.type);
      }

      if (query.status !== 'all') {
        filtered = filtered.filter((r) => r.status === query.status);
      }

      if (query.supplier) {
        filtered = filtered.filter((r) => (r.supplier ?? '') === query.supplier);
      }

      if (query.dateFrom) {
        const from = new Date(query.dateFrom + 'T00:00:00');
        filtered = filtered.filter((r) => r.expectedDoneAt >= from);
      }

      if (query.dateTo) {
        const to = new Date(query.dateTo + 'T23:59:59');
        filtered = filtered.filter((r) => r.expectedDoneAt <= to);
      }

      filtered.sort((a, b) => compareRowVM(a, b, query.sortKey, query.sortDir));

      this.exportRows = filtered.slice();

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = clamp(query.page, 1, totalPages);
      const start = (page - 1) * query.pageSize;
      const end = start + query.pageSize;

      const rows = filtered.slice(start, end).map((r, i) => ({
        ...r,
        stt: start + i + 1,
      }));

      const supplierOptions = Array.from(
        new Set(rowsAll.map((x) => x.supplier).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b));

      const processingCount = this.requests$.value.filter((r) =>
        ['RECEIVED', 'CHECKING', 'APPROVED', 'PROCESSING'].includes(r.status),
      ).length;

      const avgResolutionHours = calcAvgResolutionHours(this.requests$.value);

      return {
        query: { ...query, page },
        rows,
        totalCount: rowsAll.length,
        total,
        totalPages,
        supplierOptions,
        statusOptions: this.statusOptions,
        processingCount,
        avgResolutionHours,
      };
    }),
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.requests$.next(this.repo.list());
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const edit = qp.get('edit') === 'true';

      this.routeState$.next({ id, edit });

      if (!id) {
        this.selectedId = null;
        this.mode = 'list';
        this.detail = null;
        this.editForm = null;
        this.originalSnapshot = null;
        this.isDirty = false;
        return;
      }

      const item = this.repo.getById(id);
      if (!item) {
        this.syncRoute(null, 'list', false);
        return;
      }

      this.selectedId = id;
      this.detail = enrichDetail(item);

      if (edit) {
        this.mode = 'edit';
        this.initEditForm(item);
      } else {
        this.mode = 'detail';
        this.editForm = null;
        this.originalSnapshot = null;
        this.isDirty = false;
      }
    });
  }

  private syncRoute(id: string | null, mode: PageMode, push: boolean): void {
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

  private initEditForm(src: WarrantyRequest): void {
    this.editForm = {
      status: src.status,
      assignee: src.assignee ?? '',
      supplier: src.supplier ?? '',
      expectedDoneDate: toDateInput(src.expectedDoneAt),
      internalNote: src.internalNote ?? '',
      estimatedCost: src.estimatedCost ?? 0,
      customerOutcome: '',
    };

    this.originalSnapshot = {
      ...this.editForm,
    };
    this.isDirty = false;
  }

  private recalcDirty(): void {
    if (!this.editForm || !this.originalSnapshot) {
      this.isDirty = false;
      return;
    }
    this.isDirty = JSON.stringify(this.editForm) !== JSON.stringify(this.originalSnapshot);
  }

  patchQuery(patch: Partial<ListQuery>): void {
    const prev = this.query$.value;
    const next: ListQuery = {
      ...prev,
      ...patch,
      page: patch.page !== undefined ? patch.page : 1,
    };
    this.query$.next(next);
  }

  resetFilters(): void {
    this.query$.next({
      q: '',
      type: 'all',
      status: 'all',
      supplier: '',
      dateFrom: '',
      dateTo: '',
      sortKey: 'expectedDoneAt',
      sortDir: 'asc',
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
    const q = this.query$.value;
    this.query$.next({ ...q, page });
  }

  openDetail(id: string): void {
    this.syncRoute(id, 'detail', true);
  }

  openEditFromList(ev: MouseEvent, id: string): void {
    ev.stopPropagation();
    this.syncRoute(id, 'edit', true);
  }

  backToList(): void {
    this.attemptLeave(() => {
      this.syncRoute(null, 'list', true);
    });
  }

  onHeaderBack(): void {
    if (this.mode === 'edit') {
      this.backToDetail();
      return;
    }
    this.backToList();
  }

  goEdit(): void {
    if (!this.selectedId) return;
    this.syncRoute(this.selectedId, 'edit', true);
  }

  backToDetail(): void {
    if (!this.selectedId) {
      this.backToList();
      return;
    }

    this.attemptLeave(() => {
      this.syncRoute(this.selectedId, 'detail', true);
    });
  }

  cancelEdit(): void {
    this.backToDetail();
  }

  private attemptLeave(action: () => void): void {
    if (!this.isDirty) {
      action();
      return;
    }
    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
  }

  onConfirmDiscard(): void {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.editForm = null;
    this.originalSnapshot = null;
    this.isDirty = false;
    action?.();
  }

  onCancelDiscard(): void {
    this.discardModalOpen = false;
    this.pendingDiscardAction = null;
  }

  markDirty(): void {
    this.recalcDirty();
  }

  saveEdit(): void {
    if (!this.detail || !this.editForm) return;
    this.saveModalOpen = true;
  }

  onCancelSave(): void {
    this.saveModalOpen = false;
  }

  executeSave(): void {
    if (!this.detail || !this.editForm) {
      this.saveModalOpen = false;
      return;
    }

    this.saving = true;

    const patch: Partial<WarrantyRequest> = {
      status: this.editForm.status,
      assignee: this.editForm.assignee || undefined,
      supplier: this.editForm.supplier || undefined,
      expectedDoneAt: new Date(this.editForm.expectedDoneDate + 'T23:59:59').toISOString(),
      internalNote: this.editForm.internalNote || undefined,
      estimatedCost: Number(this.editForm.estimatedCost || 0),
    };

    const updated = this.repo.update(this.detail.id, patch);

    if (updated) {
      if (this.originalSnapshot && this.originalSnapshot.status !== updated.status) {
        this.repo.pushTimeline(updated.id, {
          at: new Date().toISOString(),
          title: `Cập nhật trạng thái: ${statusLabel(updated.status)}`,
          note: this.editForm.internalNote ? `Note: ${this.editForm.internalNote}` : undefined,
        });
      }

      if (updated.status === 'COMPLETED' && !updated.completedAt) {
        this.repo.update(updated.id, { completedAt: new Date().toISOString() });
      }

      this.requests$.next(this.repo.list());
      this.saveModalOpen = false;
      this.saving = false;
      this.syncRoute(updated.id, 'detail', true);
      return;
    }

    this.saving = false;
    this.saveModalOpen = false;
  }

  stepInfo(status: RequestStatus): { current: string; next: string | null } {
    switch (status) {
      case 'NEW':
        return { current: 'Tiếp nhận yêu cầu', next: 'Kiểm tra điều kiện' };
      case 'RECEIVED':
        return { current: 'Kiểm tra điều kiện', next: 'Theo dõi & cập nhật' };
      case 'CHECKING':
      case 'APPROVED':
      case 'PROCESSING':
        return { current: 'Theo dõi & cập nhật', next: 'Hoàn tất & phản hồi' };
      case 'REJECTED':
        return { current: 'Đã từ chối', next: null };
      case 'COMPLETED':
        return { current: 'Đã hoàn tất', next: null };
      default:
        return { current: 'Tiếp nhận yêu cầu', next: null };
    }
  }

  canAdvance(status: RequestStatus): boolean {
    const n = nextStatus(status);
    return n !== null && n !== status;
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
    this.quickNextStatus(id);
  }

  quickNextStatus(id: string): void {
    const item = this.repo.getById(id);
    if (!item) return;

    const next = nextStatus(item.status);
    if (!next || next === item.status) return;

    const updated = this.repo.update(id, { status: next });

    if (updated) {
      this.repo.pushTimeline(updated.id, {
        at: new Date().toISOString(),
        title: `Chuyển bước: ${statusLabel(next)}`,
      });

      if (next === 'COMPLETED' && !updated.completedAt) {
        this.repo.update(updated.id, { completedAt: new Date().toISOString() });
      }

      this.requests$.next(this.repo.list());

      if (this.selectedId === id) {
        this.detail = enrichDetail(this.repo.getById(id)!);
      }
    }
  }

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

    const done = this.repo.delete(id);
    if (!done) return;

    this.requests$.next(this.repo.list());

    if (this.selectedId === id) {
      this.syncRoute(null, 'list', true);
    }
  }

  statusBadgeClass(status: RequestStatus): string {
    switch (status) {
      case 'NEW':
      case 'RECEIVED':
        return 'hb-st-new';
      case 'CHECKING':
        return 'hb-st-checking';
      case 'APPROVED':
        return 'hb-st-approved';
      case 'REJECTED':
        return 'hb-st-rejected';
      case 'PROCESSING':
        return 'hb-st-processing';
      case 'COMPLETED':
        return 'hb-st-done';
      default:
        return 'hb-st-new';
    }
  }

  formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('vi-VN');
  }

  exportCsv(rows: ListRowVM[]): void {
    const header = [
      'id',
      'orderId',
      'customerName',
      'customerPhone',
      'productName',
      'variantLabel',
      'type',
      'status',
      'expectedDoneAt',
      'assignee',
      'supplier',
    ];

    const lines = rows.map((r) => [
      r.id,
      r.orderId,
      r.customerName,
      r.customerPhone,
      r.productName,
      r.variantLabel,
      r.type,
      r.status,
      r.expectedDoneAt.toISOString(),
      r.assignee ?? '',
      r.supplier ?? '',
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map((x) => csvEscape(String(x ?? ''))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `warranty-returns_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* ===================== helpers ===================== */

function toRowVM(x: WarrantyRequest): ListRowVM {
  const expectedDoneAt = new Date(x.expectedDoneAt);
  const diffMs = expectedDoneAt.getTime() - Date.now();
  const diffH = Math.round(diffMs / 36e5);
  const slaLabel = diffH <= 0 ? 'Quá hạn/đến hạn' : `Còn ~${diffH}h`;

  return {
    id: x.id,
    type: x.type,
    status: x.status,
    statusLabel: statusLabel(x.status),
    orderId: x.orderId,
    productName: x.productName,
    variantLabel: x.variantLabel,
    customerName: x.customerName,
    customerPhone: x.customerPhone,
    supplier: x.supplier,
    assignee: x.assignee,
    expectedDoneAt,
    slaLabel,
    stt: 0,
  };
}

function enrichDetail(x: WarrantyRequest): WarrantyRequestDetailVM {
  const createdAt = new Date(x.createdAt);
  const expectedDoneAt = new Date(x.expectedDoneAt);

  const resolutionHours = x.completedAt
    ? Math.round((new Date(x.completedAt).getTime() - createdAt.getTime()) / 36e5)
    : null;

  const diffMs = expectedDoneAt.getTime() - Date.now();
  const diffH = Math.round(diffMs / 36e5);
  const slaLabel = diffH <= 0 ? 'Quá hạn/đến hạn' : `Còn ~${diffH}h`;

  return {
    ...x,
    typeLabel: x.type === 'warranty' ? 'Bảo hành' : 'Đổi trả',
    statusLabel: statusLabel(x.status),
    createdAt,
    expectedDoneAt,
    slaLabel,
    resolutionHours,
  };
}

function statusLabel(s: RequestStatus): string {
  switch (s) {
    case 'NEW':
      return 'Mới tạo';
    case 'RECEIVED':
      return 'Đã tiếp nhận';
    case 'CHECKING':
      return 'Đang kiểm tra';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'REJECTED':
      return 'Từ chối';
    case 'PROCESSING':
      return 'Đang xử lý';
    case 'COMPLETED':
      return 'Hoàn tất';
    default:
      return s;
  }
}

function nextStatus(s: RequestStatus): RequestStatus | null {
  switch (s) {
    case 'NEW':
      return 'RECEIVED';
    case 'RECEIVED':
      return 'CHECKING';
    case 'CHECKING':
      return 'PROCESSING';
    case 'APPROVED':
      return 'PROCESSING';
    case 'PROCESSING':
      return 'COMPLETED';
    case 'REJECTED':
    case 'COMPLETED':
      return null;
    default:
      return null;
  }
}

function compareRowVM(a: ListRowVM, b: ListRowVM, key: keyof ListRowVM, dir: SortDir): number {
  const av: unknown = a[key];
  const bv: unknown = b[key];

  let cmp = 0;

  if (isDate(av) && isDate(bv)) cmp = av.getTime() - bv.getTime();
  else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
  else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'vi', { numeric: true });

  return dir === 'asc' ? cmp : -cmp;
}

function isDate(v: unknown): v is Date {
  return Object.prototype.toString.call(v) === '[object Date]';
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

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function calcAvgResolutionHours(items: WarrantyRequest[]): number {
  const done = items.filter((x) => !!x.completedAt);
  if (done.length === 0) return 0;

  const sum = done.reduce((acc, x) => {
    const h = (new Date(x.completedAt!).getTime() - new Date(x.createdAt).getTime()) / 36e5;
    return acc + Math.max(0, h);
  }, 0);

  return Math.round((sum / done.length) * 10) / 10;
}

function buildSeed(): WarrantyRequest[] {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();

  return [
    {
      id: 'WR-10021',
      type: 'warranty',
      status: 'NEW',
      orderId: 'OD-77821',
      customerName: 'Nguyễn Minh Anh',
      customerPhone: '0909 111 222',
      productId: 'P-1001',
      productName: 'Sofa vải Nordic 3 chỗ',
      variantLabel: 'Xám • 3 chỗ',
      supplier: 'NCC A',
      assignee: '',
      reason: 'Khung phát tiếng kêu khi ngồi',
      internalNote: '',
      createdAt: iso(now - 36e5 * 20),
      updatedAt: iso(now - 36e5 * 20),
      expectedDoneAt: iso(now + 36e5 * 28),
      completedAt: undefined,
      estimatedCost: 250000,
      attachments: ['video_khung_keu.mp4', 'img_01.jpg'],
      timeline: [
        { at: iso(now - 36e5 * 20), title: 'Tạo yêu cầu', note: 'Khách gửi mô tả lỗi + video' },
      ],
    },
    {
      id: 'WR-10022',
      type: 'return',
      status: 'CHECKING',
      orderId: 'OD-77829',
      customerName: 'Trần Quốc Huy',
      customerPhone: '0988 333 444',
      productId: 'P-1020',
      productName: 'Bàn ăn gỗ sồi 1m6',
      variantLabel: 'Gỗ sồi • 1m6',
      supplier: 'NCC B',
      assignee: 'Admin01',
      reason: 'Mặt bàn bị xước khi mở thùng',
      internalNote: 'Cần đối chiếu điều kiện đổi trả + ảnh mở thùng',
      createdAt: iso(now - 36e5 * 70),
      updatedAt: iso(now - 36e5 * 10),
      expectedDoneAt: iso(now + 36e5 * 12),
      completedAt: undefined,
      estimatedCost: 600000,
      attachments: ['unbox_01.jpg', 'scratch_closeup.jpg'],
      timeline: [
        { at: iso(now - 36e5 * 70), title: 'Tạo yêu cầu', note: 'Khách báo xước, đính kèm ảnh' },
        { at: iso(now - 36e5 * 60), title: 'Đã tiếp nhận', note: 'Admin01 nhận xử lý' },
        {
          at: iso(now - 36e5 * 10),
          title: 'Đang kiểm tra điều kiện',
          note: 'Chờ xác minh thời điểm unbox',
        },
      ],
    },
    {
      id: 'WR-10023',
      type: 'warranty',
      status: 'COMPLETED',
      orderId: 'OD-77701',
      customerName: 'Lê Thảo Vy',
      customerPhone: '0912 555 666',
      productId: 'P-0901',
      productName: 'Ghế công thái học HB-Pro',
      variantLabel: 'Đen • Pro',
      supplier: 'NCC A',
      assignee: 'Linh',
      reason: 'Tay vịn lỏng',
      internalNote: 'Đã thay chốt tay vịn',
      createdAt: iso(now - 36e5 * 240),
      updatedAt: iso(now - 36e5 * 200),
      expectedDoneAt: iso(now - 36e5 * 190),
      completedAt: iso(now - 36e5 * 200),
      estimatedCost: 120000,
      attachments: [],
      timeline: [
        { at: iso(now - 36e5 * 240), title: 'Tạo yêu cầu' },
        { at: iso(now - 36e5 * 230), title: 'Đã tiếp nhận', note: 'Linh nhận xử lý' },
        { at: iso(now - 36e5 * 220), title: 'Đang kiểm tra điều kiện' },
        { at: iso(now - 36e5 * 210), title: 'Đã duyệt', note: 'Thuộc bảo hành 12 tháng' },
        { at: iso(now - 36e5 * 205), title: 'Đang xử lý' },
        { at: iso(now - 36e5 * 200), title: 'Hoàn tất', note: 'Đã thay chốt tay vịn' },
      ],
    },
  ];
}
