import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map } from 'rxjs';

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
  at: string; // ISO
  title: string;
  note?: string;
}

interface WarrantyRequest {
  id: string; // phase sau -> Mongo ObjectId string
  type: RequestType;
  status: RequestStatus;

  orderId: string;
  customerName: string;
  customerPhone: string;

  productId: string;
  productName: string;
  variantLabel: string;

  supplier?: string; // NCC
  assignee?: string; // admin/staff phụ trách

  reason: string;
  internalNote?: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
  expectedDoneAt: string; // ISO (SLA target)
  completedAt?: string; // ISO

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

  status: RequestStatus;
  statusLabel: string;

  orderId: string;

  productName: string;
  variantLabel: string;

  supplier?: string;
  assignee?: string;

  expectedDoneAt: Date;
  slaLabel: string;
}

interface ListQuery {
  q: string;
  type: 'all' | RequestType;
  status: 'all' | RequestStatus;
  supplier: string;

  dateFrom: string; // yyyy-MM-dd
  dateTo: string; // yyyy-MM-dd

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
  expectedDoneDate: string; // yyyy-MM-dd
  internalNote: string;
  estimatedCost: number;
  customerOutcome: '' | 'call' | 'email' | 'chat';
}

/** Repository mock (phase sau thay bằng HttpClient gọi API MongoDB) */
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
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor, DatePipe],
  templateUrl: './management-warranty.html',
  styleUrls: ['./management-warranty.css'],
})
export class ManagementWarranty implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private repo = new WarrantyRequestRepository();

  mode: PageMode = 'list';
  selectedId: string | null = null;

  private requests$ = new BehaviorSubject<WarrantyRequest[]>([]);

  detail: WarrantyRequestDetailVM | null = null;
  editForm: EditForm | null = null;
  private originalSnapshot: WarrantyRequest | null = null;

  isDirty = false;
  saving = false;

  exportRows: ListRowVM[] = [];

  statusOptions: StatusOption[] = [
    { value: 'NEW', label: 'Mới tạo' },
    { value: 'RECEIVED', label: 'Đã tiếp nhận' },
    { value: 'CHECKING', label: 'Đang kiểm tra điều kiện' },
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

      if (q) {
        filtered = filtered.filter((r) => {
          const hay =
            `${r.id} ${r.orderId} ${r.productName} ${r.variantLabel} ${r.assignee ?? ''} ${r.supplier ?? ''}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (query.type !== 'all') {
        // list row vm không giữ type -> filter theo source (phase sau backend filter)
        // tạm thời bỏ qua type filter trong list row. (vẫn giữ select để đồng bộ UI)
      }

      if (query.status !== 'all') filtered = filtered.filter((r) => r.status === query.status);
      if (query.supplier) filtered = filtered.filter((r) => (r.supplier ?? '') === query.supplier);

      if (query.dateFrom) {
        const from = new Date(query.dateFrom + 'T00:00:00');
        filtered = filtered.filter((r) => r.expectedDoneAt >= from);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo + 'T23:59:59');
        filtered = filtered.filter((r) => r.expectedDoneAt <= to);
      }

      // SORT
      filtered.sort((a, b) => compareRowVM(a, b, query.sortKey, query.sortDir));

      // export cache
      this.exportRows = filtered;

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = clamp(query.page, 1, totalPages);

      const start = (page - 1) * query.pageSize;
      const end = start + query.pageSize;
      const rows = filtered.slice(start, end);

      const supplierOptions = Array.from(
        new Set(rowsAll.map((x) => x.supplier).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b));

      const rangeLabel = total === 0 ? '0-0' : `${start + 1}-${Math.min(end, total)}`;

      const processingCount = filtered.filter((r) =>
        ['RECEIVED', 'CHECKING', 'APPROVED', 'PROCESSING'].includes(r.status),
      ).length;

      const avgResolutionHours = calcAvgResolutionHours(this.requests$.value);

      return {
        query: { ...query, page },
        rows,
        total,
        totalPages,
        rangeLabel,
        supplierOptions,
        statusOptions: this.statusOptions,
        processingCount,
        avgResolutionHours,
      };
    }),
  );

  ngOnInit(): void {
    this.requests$.next(this.repo.list());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== List interactions =====
  patchQuery(patch: Partial<ListQuery>): void {
    const prev = this.query$.value;
    const next: ListQuery = {
      ...prev,
      ...patch,
      page: patch.page ? patch.page : 1,
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

  isSortKey(key: keyof ListRowVM): boolean {
    return this.query$.value.sortKey === key;
  }

  isSortDir(dir: SortDir): boolean {
    return this.query$.value.sortDir === dir;
  }

  goPage(page: number): void {
    const q = this.query$.value;
    this.query$.next({ ...q, page });
  }

  openDetail(id: string): void {
    const item = this.repo.getById(id);
    if (!item) return;

    this.selectedId = id;
    this.mode = 'detail';
    this.detail = enrichDetail(item);
    this.editForm = null;
    this.originalSnapshot = null;
    this.isDirty = false;
  }

  backToList(): void {
    this.mode = 'list';
    this.detail = null;
    this.editForm = null;
    this.originalSnapshot = null;
    this.isDirty = false;
  }

  // ===== Icon actions in list =====
  openEditFromList(ev: MouseEvent, id: string): void {
    ev.stopPropagation();
    this.openDetail(id);
    this.goEdit();
  }

  deleteFromList(ev: MouseEvent, id: string): void {
    ev.stopPropagation();
    this.deleteRequest(id);
  }

  // ===== Detail/Edit =====
  goEdit(): void {
    if (!this.detail) return;
    const src = this.repo.getById(this.detail.id);
    if (!src) return;

    this.mode = 'edit';
    this.originalSnapshot = structuredClone(src);

    this.editForm = {
      status: src.status,
      assignee: src.assignee ?? '',
      supplier: src.supplier ?? '',
      expectedDoneDate: toDateInput(src.expectedDoneAt),
      internalNote: src.internalNote ?? '',
      estimatedCost: src.estimatedCost ?? 0,
      customerOutcome: '',
    };

    this.isDirty = false;
  }

  cancelEdit(): void {
    if (!this.originalSnapshot) {
      this.backToList();
      return;
    }
    this.detail = enrichDetail(this.originalSnapshot);
    this.mode = 'detail';
    this.editForm = null;
    this.isDirty = false;
  }

  markDirty(): void {
    this.isDirty = true;
  }

  saveEdit(): void {
    if (!this.detail || !this.editForm) return;

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

      const fresh = this.repo.getById(updated.id)!;
      this.detail = enrichDetail(fresh);

      this.mode = 'detail';
      this.editForm = null;
      this.originalSnapshot = null;
      this.isDirty = false;
    }

    this.saving = false;
  }

  // ===== BPMN step/advance =====
  stepInfo(status: RequestStatus): { current: string; next: string | null } {
    // BPMN: Tiếp nhận -> Kiểm tra điều kiện -> Theo dõi & cập nhật -> Hoàn tất & phản hồi
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
        return { current: 'Tiếp nhận yêu cầu', next: 'Kiểm tra điều kiện' };
    }
  }

  canAdvance(status: RequestStatus): boolean {
    const n = nextStatus(status);
    return n !== null && n !== status;
  }

  advanceWithConfirm(id: string): void {
    const item = this.repo.getById(id);
    if (!item) return;

    const info = this.stepInfo(item.status);
    const nextSt = nextStatus(item.status);

    if (!nextSt || !info.next) return;

    const ok = window.confirm(
      `Đang ở: ${info.current}\nTiếp theo: ${info.next}\n\nXác nhận chuyển bước?`,
    );
    if (!ok) return;

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

      if (this.mode !== 'list') {
        this.detail = enrichDetail(this.repo.getById(id)!);
      }
    }
  }

  deleteRequest(id: string): void {
    const item = this.repo.getById(id);
    if (!item) return;

    const ok = window.confirm(`Xóa yêu cầu ${id}? Thao tác này không thể hoàn tác.`);
    if (!ok) return;

    const done = this.repo.delete(id);
    if (!done) return;

    this.requests$.next(this.repo.list());

    if (this.selectedId === id) {
      this.backToList();
      this.selectedId = null;
    }
  }

  // ===== UI helpers =====
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

  exportCsv(rows: ListRowVM[]): void {
    const header = [
      'id',
      'orderId',
      'productName',
      'variantLabel',
      'status',
      'expectedDoneAt',
      'assignee',
      'supplier',
    ];

    const lines = rows.map((r) => [
      r.id,
      r.orderId,
      r.productName,
      r.variantLabel,
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
  const diffH = Math.max(0, Math.round((expectedDoneAt.getTime() - Date.now()) / 36e5));
  const slaLabel = diffH === 0 ? 'Quá hạn/đến hạn' : `Còn ~${diffH}h`;

  return {
    id: x.id,
    status: x.status,
    statusLabel: statusLabel(x.status),

    orderId: x.orderId,

    productName: x.productName,
    variantLabel: x.variantLabel,

    supplier: x.supplier,
    assignee: x.assignee,

    expectedDoneAt,
    slaLabel,
  };
}

function enrichDetail(x: WarrantyRequest): WarrantyRequestDetailVM {
  const createdAt = new Date(x.createdAt);
  const expectedDoneAt = new Date(x.expectedDoneAt);

  const resolutionHours = x.completedAt
    ? Math.round((new Date(x.completedAt).getTime() - createdAt.getTime()) / 36e5)
    : null;

  const diffH = Math.max(0, Math.round((expectedDoneAt.getTime() - Date.now()) / 36e5));
  const slaLabel = diffH === 0 ? 'Quá hạn/đến hạn' : `Còn ~${diffH}h`;

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

/**
 * Quy tắc chuyển bước nhanh (bấm "Chuyển bước")
 * - NEW -> RECEIVED -> CHECKING -> PROCESSING -> COMPLETED
 * - APPROVED -> PROCESSING (nếu có dùng approve)
 * - REJECTED/COMPLETED: không chuyển
 */
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
  else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'vi');

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

/* ===== seed ===== */
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
