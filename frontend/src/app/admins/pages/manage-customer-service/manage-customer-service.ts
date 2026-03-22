import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type PageMode = 'list' | 'detail' | 'edit';

type InquiryChannel = 'chat' | 'email' | 'phone' | 'form';
type InquiryCategory =
  | 'product_info'
  | 'order_status'
  | 'return_policy'
  | 'payment'
  | 'delivery'
  | 'complaint'
  | 'other';

type InquiryStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

interface TimelineItem {
  at: string;
  actor: string;
  title: string;
  note?: string;
}

interface CustomerInquiry {
  id: string;
  channel: InquiryChannel;
  category: InquiryCategory;
  status: InquiryStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  subject: string;
  content: string;
  internalNote?: string;
  resolution?: string;

  assignee?: string;
  tags: string[];

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  expectedReplyAt: string;

  timeline: TimelineItem[];
}

type InquiryDetailVM = Omit<CustomerInquiry, 'createdAt' | 'expectedReplyAt'> & {
  createdAt: Date;
  expectedReplyAt: Date;
  statusLabel: string;
  categoryLabel: string;
  channelLabel: string;
  priorityLabel: string;
  slaLabel: string;
  resolutionHours: number | null;
};

interface ListRowVM {
  id: string;
  stt: number;
  channel: InquiryChannel;
  category: InquiryCategory;
  status: InquiryStatus;
  statusLabel: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priorityLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subject: string;
  assignee?: string;
  categoryLabel: string;
  expectedReplyAt: Date;
  slaLabel: string;
  isSlaBreached: boolean;
}

interface ListQuery {
  q: string;
  channel: 'all' | InquiryChannel;
  category: 'all' | InquiryCategory;
  status: 'all' | InquiryStatus;
  priority: 'all' | string;
  dateFrom: string;
  dateTo: string;
  sortKey: keyof ListRowVM;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

interface EditForm {
  status: InquiryStatus;
  assignee: string;
  priority: string;
  internalNote: string;
  resolution: string;
  category: InquiryCategory;
}

class InquiryRepository {
  private seed: CustomerInquiry[] = buildSeed();

  list(): CustomerInquiry[] { return this.seed.slice(); }

  getById(id: string): CustomerInquiry | null {
    return this.seed.find((x) => x.id === id) ?? null;
  }

  update(id: string, patch: Partial<CustomerInquiry>): CustomerInquiry | null {
    const idx = this.seed.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    this.seed[idx] = { ...this.seed[idx], ...patch, updatedAt: new Date().toISOString() };
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
  selector: 'app-manage-customer-service',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor, DatePipe, ConfirmModal],
  templateUrl: './manage-customer-service.html',
  styleUrls: ['./manage-customer-service.css'],
})
export class ManageCustomerService implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private repo = new InquiryRepository();

  mode: PageMode = 'list';
  selectedId: string | null = null;

  private inquiries$ = new BehaviorSubject<CustomerInquiry[]>([]);

  detail: InquiryDetailVM | null = null;
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

  statusOptions: { value: InquiryStatus; label: string }[] = [
    { value: 'NEW', label: 'Mới' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'WAITING_CUSTOMER', label: 'Chờ KH phản hồi' },
    { value: 'ESCALATED', label: 'Leo thang' },
    { value: 'RESOLVED', label: 'Đã giải quyết' },
    { value: 'CLOSED', label: 'Đã đóng' },
  ];

  priorityOptions = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' },
  ];

  categoryOptions: { value: InquiryCategory; label: string }[] = [
    { value: 'product_info', label: 'Thông tin sản phẩm' },
    { value: 'order_status', label: 'Trạng thái đơn hàng' },
    { value: 'return_policy', label: 'Chính sách đổi trả' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'delivery', label: 'Giao hàng' },
    { value: 'complaint', label: 'Khiếu nại' },
    { value: 'other', label: 'Khác' },
  ];

  query$ = new BehaviorSubject<ListQuery>({
    q: '', channel: 'all', category: 'all', status: 'all', priority: 'all',
    dateFrom: '', dateTo: '',
    sortKey: 'expectedReplyAt', sortDir: 'asc', page: 1, pageSize: 10,
  });

  private rowsAll$ = this.inquiries$.pipe(map((items) => items.map((x) => toRowVM(x))));

  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      let filtered = rowsAll.slice();
      const q = (query.q || '').trim().toLowerCase();

      if (q.length >= 1) {
        filtered = filtered.filter((r) => {
          const hay = `${r.id} ${r.customerName} ${r.customerPhone} ${r.customerEmail} ${r.subject} ${r.assignee ?? ''}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (query.channel !== 'all') filtered = filtered.filter((r) => r.channel === query.channel);
      if (query.category !== 'all') filtered = filtered.filter((r) => r.category === query.category);
      if (query.status !== 'all') filtered = filtered.filter((r) => r.status === query.status);
      if (query.priority !== 'all') filtered = filtered.filter((r) => r.priority === query.priority);

      if (query.dateFrom) {
        const from = new Date(query.dateFrom + 'T00:00:00');
        filtered = filtered.filter((r) => r.expectedReplyAt >= from);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo + 'T23:59:59');
        filtered = filtered.filter((r) => r.expectedReplyAt <= to);
      }

      filtered.sort((a, b) => compareRow(a, b, query.sortKey, query.sortDir));

      this.exportRows = filtered.slice();

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const page = clamp(query.page, 1, totalPages);
      const start = (page - 1) * query.pageSize;
      const rows = filtered.slice(start, start + query.pageSize).map((r, i) => ({ ...r, stt: start + i + 1 }));

      const all = this.inquiries$.value;
      const kpiNew = all.filter((x) => x.status === 'NEW').length;
      const kpiInProgress = all.filter((x) => x.status === 'IN_PROGRESS').length;
      const kpiEscalated = all.filter((x) => x.status === 'ESCALATED').length;
      const kpiResolved = all.filter((x) => x.status === 'RESOLVED' || x.status === 'CLOSED').length;
      const kpiBreached = rowsAll.filter((x) => x.isSlaBreached && x.status !== 'RESOLVED' && x.status !== 'CLOSED').length;

      return {
        query: { ...query, page },
        rows, total, totalPages,
        kpiNew, kpiInProgress, kpiEscalated, kpiResolved, kpiBreached,
        totalCount: rowsAll.length,
        statusOptions: this.statusOptions,
      };
    }),
  );

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.inquiries$.next(this.repo.list());
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
      if (!item) { this.syncRoute(null, 'list', false); return; }

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
      queryParams: { id: id ?? null, edit: id && mode === 'edit' ? 'true' : null },
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  private initEditForm(src: CustomerInquiry): void {
    this.editForm = {
      status: src.status,
      assignee: src.assignee ?? '',
      priority: src.priority,
      internalNote: src.internalNote ?? '',
      resolution: src.resolution ?? '',
      category: src.category,
    };
    this.originalSnapshot = { ...this.editForm };
    this.isDirty = false;
  }

  markDirty(): void {
    if (!this.editForm || !this.originalSnapshot) { this.isDirty = false; return; }
    this.isDirty = JSON.stringify(this.editForm) !== JSON.stringify(this.originalSnapshot);
  }

  patchQuery(patch: Partial<ListQuery>): void {
    const prev = this.query$.value;
    this.query$.next({ ...prev, ...patch, page: patch.page !== undefined ? patch.page : 1 });
  }

  resetFilters(): void {
    this.query$.next({
      q: '', channel: 'all', category: 'all', status: 'all', priority: 'all',
      dateFrom: '', dateTo: '',
      sortKey: 'expectedReplyAt', sortDir: 'asc', page: 1, pageSize: 10,
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
    if (this.query$.value.sortKey !== key) return 'bi-arrow-down-up';
    return this.query$.value.sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  goPage(page: number): void {
    const q = this.query$.value;
    this.query$.next({ ...q, page });
  }

  openDetail(id: string): void { this.syncRoute(id, 'detail', true); }
  openEditFromList(ev: MouseEvent, id: string): void { ev.stopPropagation(); this.syncRoute(id, 'edit', true); }

  backToList(): void {
    this.attemptLeave(() => this.syncRoute(null, 'list', true));
  }

  onHeaderBack(): void {
    if (this.mode === 'edit') { this.backToDetail(); return; }
    this.backToList();
  }

  goEdit(): void {
    if (!this.selectedId) return;
    this.syncRoute(this.selectedId, 'edit', true);
  }

  backToDetail(): void {
    if (!this.selectedId) { this.backToList(); return; }
    this.attemptLeave(() => this.syncRoute(this.selectedId, 'detail', true));
  }

  cancelEdit(): void { this.backToDetail(); }

  private attemptLeave(action: () => void): void {
    if (!this.isDirty) { action(); return; }
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

  saveEdit(): void {
    if (!this.detail || !this.editForm) return;
    this.saveModalOpen = true;
  }

  onCancelSave(): void { this.saveModalOpen = false; }

  executeSave(): void {
    if (!this.detail || !this.editForm) { this.saveModalOpen = false; return; }
    this.saving = true;

    const patch: Partial<CustomerInquiry> = {
      status: this.editForm.status,
      assignee: this.editForm.assignee || undefined,
      priority: this.editForm.priority as CustomerInquiry['priority'],
      internalNote: this.editForm.internalNote || undefined,
      resolution: this.editForm.resolution || undefined,
      category: this.editForm.category,
    };

    const updated = this.repo.update(this.detail.id, patch);

    if (updated) {
      if (this.originalSnapshot && this.originalSnapshot.status !== updated.status) {
        this.repo.pushTimeline(updated.id, {
          at: new Date().toISOString(),
          actor: 'Admin',
          title: `Cập nhật trạng thái: ${statusLabel(updated.status)}`,
          note: this.editForm.internalNote || undefined,
        });
      }
      if (updated.status === 'RESOLVED' && !updated.resolvedAt) {
        this.repo.update(updated.id, { resolvedAt: new Date().toISOString() });
      }
      this.inquiries$.next(this.repo.list());
      this.saveModalOpen = false;
      this.saving = false;
      this.syncRoute(updated.id, 'detail', true);
      return;
    }

    this.saving = false;
    this.saveModalOpen = false;
  }

  canAdvance(status: InquiryStatus): boolean {
    return nextStatus(status) !== null;
  }

  advanceWithConfirm(id: string): void {
    this.advanceTargetId = id;
    this.advanceModalOpen = true;
  }

  onCancelAdvance(): void { this.advanceModalOpen = false; this.advanceTargetId = null; }

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
    if (!next) return;

    const updated = this.repo.update(id, { status: next });
    if (updated) {
      this.repo.pushTimeline(updated.id, {
        at: new Date().toISOString(),
        actor: 'Admin',
        title: `Chuyển bước: ${statusLabel(next)}`,
      });
      if (next === 'RESOLVED' && !updated.resolvedAt) {
        this.repo.update(updated.id, { resolvedAt: new Date().toISOString() });
      }
      this.inquiries$.next(this.repo.list());
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

  onCancelDelete(): void { this.deleteModalOpen = false; this.deleteTargetId = null; }

  onConfirmDelete(): void {
    const id = this.deleteTargetId;
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
    if (!id) return;
    const done = this.repo.delete(id);
    if (!done) return;
    this.inquiries$.next(this.repo.list());
    if (this.selectedId === id) this.syncRoute(null, 'list', true);
  }

  statusBadgeClass(status: InquiryStatus): string {
    switch (status) {
      case 'NEW': return 'hb-st-new';
      case 'IN_PROGRESS': return 'hb-st-checking';
      case 'WAITING_CUSTOMER': return 'hb-st-approved';
      case 'ESCALATED': return 'hb-st-rejected';
      case 'RESOLVED': return 'hb-st-done';
      case 'CLOSED': return 'hb-st-done';
      default: return 'hb-st-new';
    }
  }

  priorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'low': return 'hb-pri-low';
      case 'medium': return 'hb-pri-medium';
      case 'high': return 'hb-pri-high';
      case 'urgent': return 'hb-pri-urgent';
      default: return 'hb-pri-low';
    }
  }

  channelIcon(channel: InquiryChannel): string {
    switch (channel) {
      case 'chat': return 'bi-chat-dots';
      case 'email': return 'bi-envelope';
      case 'phone': return 'bi-telephone';
      case 'form': return 'bi-card-checklist';
      default: return 'bi-question-circle';
    }
  }

  formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('vi-VN');
  }

  exportCsv(rows: ListRowVM[]): void {
    const header = ['ID', 'Khách hàng', 'SĐT', 'Email', 'Chủ đề', 'Kênh', 'Danh mục', 'Độ ưu tiên', 'Trạng thái', 'Người xử lý', 'Thời hạn phản hồi'];
    const lines = rows.map((r) => [
      r.id, r.customerName, r.customerPhone, r.customerEmail, r.subject,
      r.channel, r.category, r.priority, r.status, r.assignee ?? '', r.expectedReplyAt.toISOString(),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-service_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/* =================== helpers =================== */

function toRowVM(x: CustomerInquiry): ListRowVM {
  const expectedReplyAt = new Date(x.expectedReplyAt);
  const diffMs = expectedReplyAt.getTime() - Date.now();
  const diffH = Math.round(diffMs / 36e5);
  const isSlaBreached = diffMs <= 0;
  const slaLabel = isSlaBreached ? 'Quá hạn' : `Còn ~${diffH}h`;

  return {
    id: x.id,
    stt: 0,
    channel: x.channel,
    category: x.category,
    status: x.status,
    statusLabel: statusLabel(x.status),
    priority: x.priority,
    priorityLabel: priorityLabel(x.priority),
    customerName: x.customerName,
    customerPhone: x.customerPhone,
    customerEmail: x.customerEmail,
    subject: x.subject,
    assignee: x.assignee,
    categoryLabel: categoryLabel(x.category),
    expectedReplyAt,
    slaLabel,
    isSlaBreached,
  };
}

function enrichDetail(x: CustomerInquiry): InquiryDetailVM {
  const createdAt = new Date(x.createdAt);
  const expectedReplyAt = new Date(x.expectedReplyAt);
  const resolutionHours = x.resolvedAt
    ? Math.round((new Date(x.resolvedAt).getTime() - createdAt.getTime()) / 36e5)
    : null;
  const diffMs = expectedReplyAt.getTime() - Date.now();
  const diffH = Math.round(diffMs / 36e5);
  const slaLabel = diffMs <= 0 ? 'Quá hạn' : `Còn ~${diffH}h`;

  return {
    ...x,
    createdAt,
    expectedReplyAt,
    statusLabel: statusLabel(x.status),
    categoryLabel: categoryLabel(x.category),
    channelLabel: channelLabel(x.channel),
    priorityLabel: priorityLabel(x.priority),
    slaLabel,
    resolutionHours,
  };
}

function statusLabel(s: InquiryStatus): string {
  switch (s) {
    case 'NEW': return 'Mới';
    case 'IN_PROGRESS': return 'Đang xử lý';
    case 'WAITING_CUSTOMER': return 'Chờ KH phản hồi';
    case 'ESCALATED': return 'Leo thang';
    case 'RESOLVED': return 'Đã giải quyết';
    case 'CLOSED': return 'Đã đóng';
    default: return s;
  }
}

function categoryLabel(c: InquiryCategory): string {
  switch (c) {
    case 'product_info': return 'Thông tin sản phẩm';
    case 'order_status': return 'Trạng thái đơn hàng';
    case 'return_policy': return 'Chính sách đổi trả';
    case 'payment': return 'Thanh toán';
    case 'delivery': return 'Giao hàng';
    case 'complaint': return 'Khiếu nại';
    case 'other': return 'Khác';
    default: return c;
  }
}

function channelLabel(c: InquiryChannel): string {
  switch (c) {
    case 'chat': return 'Live Chat';
    case 'email': return 'Email';
    case 'phone': return 'Điện thoại';
    case 'form': return 'Form liên hệ';
    default: return c;
  }
}

function priorityLabel(p: string): string {
  switch (p) {
    case 'low': return 'Thấp';
    case 'medium': return 'Trung bình';
    case 'high': return 'Cao';
    case 'urgent': return 'Khẩn cấp';
    default: return p;
  }
}

function nextStatus(s: InquiryStatus): InquiryStatus | null {
  switch (s) {
    case 'NEW': return 'IN_PROGRESS';
    case 'IN_PROGRESS': return 'WAITING_CUSTOMER';
    case 'WAITING_CUSTOMER': return 'RESOLVED';
    case 'ESCALATED': return 'IN_PROGRESS';
    case 'RESOLVED': return 'CLOSED';
    case 'CLOSED': return null;
    default: return null;
  }
}

function compareRow(a: ListRowVM, b: ListRowVM, key: keyof ListRowVM, dir: SortDir): number {
  const av = a[key];
  const bv = b[key];
  if (av === bv) return 0;
  let result: number;
  if (av instanceof Date && bv instanceof Date) {
    result = av.getTime() - bv.getTime();
  } else {
    result = String(av ?? '').localeCompare(String(bv ?? ''));
  }
  return dir === 'asc' ? result : -result;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function buildSeed(): CustomerInquiry[] {
  const now = Date.now();

  function makeTimeline(statusList: InquiryStatus[]): TimelineItem[] {
    return statusList.reverse().map((s, i) => ({
      at: new Date(now - i * 3600000 * 2).toISOString(),
      actor: 'Admin',
      title: `Cập nhật: ${statusLabel(s)}`,
    }));
  }

  return [
    {
      id: 'CSQ_001',
      channel: 'chat',
      category: 'order_status',
      status: 'IN_PROGRESS',
      priority: 'high',
      customerName: 'Nguyễn Văn An',
      customerPhone: '0901234567',
      customerEmail: 'an.nguyen@email.com',
      subject: 'Đơn hàng #DH00234 chưa nhận được sau 7 ngày',
      content: 'Tôi đặt đơn hàng #DH00234 từ 7 ngày trước nhưng vẫn chưa nhận được hàng. Hệ thống hiển thị "Đang giao hàng" nhưng không có cập nhật mới.',
      internalNote: 'Đã liên hệ bộ phận vận chuyển, đang chờ phản hồi.',
      assignee: 'Trần Thị Bảo',
      tags: ['đơn hàng', 'giao hàng chậm'],
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      updatedAt: new Date(now - 3600000 * 3).toISOString(),
      expectedReplyAt: new Date(now + 3600000 * 2).toISOString(),
      timeline: makeTimeline(['NEW', 'IN_PROGRESS']),
    },
    {
      id: 'CSQ_002',
      channel: 'email',
      category: 'return_policy',
      status: 'NEW',
      priority: 'medium',
      customerName: 'Lê Thị Hoa',
      customerPhone: '0912345678',
      customerEmail: 'hoa.le@gmail.com',
      subject: 'Hỏi về chính sách đổi trả ghế sofa',
      content: 'Tôi muốn hỏi về chính sách đổi trả trong vòng 30 ngày cho sản phẩm sofa. Sản phẩm tôi mua bị lỗi vải ở góc phải.',
      assignee: undefined,
      tags: ['đổi trả', 'sofa'],
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      updatedAt: new Date(now - 3600000 * 5).toISOString(),
      expectedReplyAt: new Date(now + 3600000 * 8).toISOString(),
      timeline: [{ at: new Date(now - 3600000 * 5).toISOString(), actor: 'Hệ thống', title: 'Yêu cầu được tạo tự động từ Email' }],
    },
    {
      id: 'CSQ_003',
      channel: 'phone',
      category: 'complaint',
      status: 'ESCALATED',
      priority: 'urgent',
      customerName: 'Phạm Quốc Bình',
      customerPhone: '0987654321',
      customerEmail: 'binh.pham@company.vn',
      subject: 'Khiếu nại nhân viên tư vấn thái độ không tốt',
      content: 'Nhân viên tư vấn tại showroom đã có thái độ thiếu chuyên nghiệp khi tôi hỏi về sản phẩm. Tôi yêu cầu được xử lý nghiêm túc.',
      internalNote: 'Leo thang lên quản lý cấp cao. Cần phỏng vấn nhân viên liên quan.',
      assignee: 'Nguyễn Minh Trưởng',
      tags: ['khiếu nại', 'nhân viên', 'khẩn cấp'],
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
      expectedReplyAt: new Date(now - 3600000 * 2).toISOString(),
      timeline: makeTimeline(['NEW', 'IN_PROGRESS', 'ESCALATED']),
    },
    {
      id: 'CSQ_004',
      channel: 'form',
      category: 'product_info',
      status: 'WAITING_CUSTOMER',
      priority: 'low',
      customerName: 'Đặng Thị Mai',
      customerPhone: '0933111222',
      customerEmail: 'mai.dang@email.com',
      subject: 'Hỏi kích thước bàn ăn BA-2024-OAK',
      content: 'Cho tôi hỏi kích thước chính xác của bộ bàn ăn mã BA-2024-OAK, cụ thể chiều cao và chiều rộng khi gập lại.',
      resolution: 'Đã gửi brochure kỹ thuật qua email. Chờ khách hàng xác nhận kích thước phù hợp.',
      assignee: 'Lý Hoàng Nam',
      tags: ['thông tin sản phẩm', 'bàn ăn'],
      createdAt: new Date(now - 86400000 * 3).toISOString(),
      updatedAt: new Date(now - 86400000).toISOString(),
      expectedReplyAt: new Date(now + 86400000).toISOString(),
      timeline: makeTimeline(['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER']),
    },
    {
      id: 'CSQ_005',
      channel: 'chat',
      category: 'payment',
      status: 'RESOLVED',
      priority: 'high',
      customerName: 'Võ Thanh Tùng',
      customerPhone: '0944333444',
      customerEmail: 'tung.vo@hotmail.com',
      subject: 'Bị trừ tiền hai lần cho một đơn hàng',
      content: 'Tôi thanh toán đơn hàng #DH00189 nhưng ngân hàng báo bị trừ tiền 2 lần. Vui lòng kiểm tra và hoàn tiền.',
      resolution: 'Đã xác minh lỗi cổng thanh toán. Đã liên hệ bộ phận kế toán hoàn tiền trong 3-5 ngày làm việc.',
      assignee: 'Trần Thị Bảo',
      tags: ['thanh toán', 'hoàn tiền'],
      createdAt: new Date(now - 86400000 * 5).toISOString(),
      updatedAt: new Date(now - 86400000 * 2).toISOString(),
      resolvedAt: new Date(now - 86400000 * 2).toISOString(),
      expectedReplyAt: new Date(now - 86400000 * 3).toISOString(),
      timeline: makeTimeline(['NEW', 'IN_PROGRESS', 'RESOLVED']),
    },
    {
      id: 'CSQ_006',
      channel: 'email',
      category: 'delivery',
      status: 'NEW',
      priority: 'medium',
      customerName: 'Hoàng Thị Lan',
      customerPhone: '0966555666',
      customerEmail: 'lan.hoang@yahoo.com',
      subject: 'Yêu cầu đổi địa chỉ giao hàng đơn #DH00312',
      content: 'Tôi muốn thay đổi địa chỉ giao hàng cho đơn #DH00312. Địa chỉ mới: 123 Nguyễn Huệ, Q1, TP.HCM.',
      assignee: undefined,
      tags: ['giao hàng', 'đổi địa chỉ'],
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      updatedAt: new Date(now - 3600000 * 2).toISOString(),
      expectedReplyAt: new Date(now + 3600000 * 20).toISOString(),
      timeline: [{ at: new Date(now - 3600000 * 2).toISOString(), actor: 'Hệ thống', title: 'Yêu cầu được tạo tự động từ Email' }],
    },
  ];
}
