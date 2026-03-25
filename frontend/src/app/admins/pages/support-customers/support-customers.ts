import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { CustomerInquiryService } from '../../../services/customer-inquiry-service';
import { ICustomerInquiry } from '../../../../interface';

type SortDir = 'asc' | 'desc';
type PageMode = 'list' | 'detail' | 'edit';

type InquiryChannel = 'chat' | 'email' | 'phone' | 'form';
type InquiryCategory =
  | 'order'
  | 'product'
  | 'warranty'
  | 'other';

type InquiryStatus =
  | 'open'
  | 'in_progress'
  | 'closed';

interface TimelineItem {
  at: string;
  actor: string;
  title: string;
  note?: string;
}

interface CustomerInquiry {
  id: string;
  _id?: string;
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
  assigneeId?: string;
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
  status: string;
  assignee: string;
  priority: string;
  internalNote: string;
  resolution: string;
  category: string;
}

@Component({
  selector: 'app-support-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor, DatePipe, ConfirmModal],
  templateUrl: './support-customers.html',
  styleUrls: ['./support-customers.css'],
})
export class SupportCustomers implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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
    { value: 'open', label: 'Mới' },
    { value: 'in_progress', label: 'Đang xử lý' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  priorityOptions = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' },
  ];

  categoryOptions: { value: InquiryCategory; label: string }[] = [
    { value: 'order', label: 'Vấn đề đơn hàng' },
    { value: 'product', label: 'Tư vấn sản phẩm' },
    { value: 'warranty', label: 'Yêu cầu bảo hành' },
    { value: 'other', label: 'Góp ý khác' },
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
      const kpiNew = all.filter((x) => x.status === 'open').length;
      const kpiInProgress = all.filter((x) => x.status === 'in_progress').length;
      const kpiClosed = all.filter((x) => x.status === 'closed').length;
      const kpiBreached = rowsAll.filter((x) => x.isSlaBreached && x.status !== 'closed').length;

      return {
        query: { ...query, page },
        rows, total, totalPages,
        kpiNew, kpiInProgress, kpiClosed, kpiBreached,
        totalCount: rowsAll.length,
        statusOptions: this.statusOptions,
      };
    }),
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inquiryService: CustomerInquiryService
  ) { }

  ngOnInit(): void {
    this.loadInquiries();
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInquiries(): void {
    this.inquiryService.getAllInquiries().subscribe({
      next: (res) => {
        const mappedData = (res.data || []).map(item => this.mapBackendToLocal(item));
        this.inquiries$.next(mappedData);
      },
      error: (err) => {
        console.error('Failed to load inquiries', err);
      }
    });
  }

  private mapBackendToLocal(item: ICustomerInquiry): CustomerInquiry {
    const user = (item.user_id && typeof item.user_id === 'object') ? item.user_id : { name: 'Khách vãng lai', email: '—', phone: '—' };
    const staff = typeof item.resolving_staff_id === 'object' ? item.resolving_staff_id : null;
    
    return {
      id: item._id,
      _id: item._id,
      channel: 'form',
      category: item.category as any,
      status: (item.status || 'open') as any,
      priority: this.mapPriorityToLocal(item.priority || 'medium'),
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      subject: item.subject,
      content: item.message,
      internalNote: item.internal_notes,
      resolution: item.staff_response,
      assignee: staff?.name,
      assigneeId: staff?._id,
      tags: [],
      createdAt: (item.createdAt as string) || new Date().toISOString(),
      updatedAt: (item.updatedAt as string) || new Date().toISOString(),
      expectedReplyAt: (item.due_date as string) || new Date().toISOString(),
      timeline: []
    } as any;
  }

  private mapPriorityToLocal(p: string): any {
    switch (p) {
      case 'low': case 'Thấp': return 'low';
      case 'medium': case 'Trung bình': return 'medium';
      case 'high': case 'Cao': return 'high';
      case 'urgent': case 'Khẩn cấp': return 'urgent';
      default: return p || 'medium';
    }
  }

  private mapLocalPriorityToBackend(p: string): string {
    switch (p) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      case 'urgent': return 'urgent';
      default: return p;
    }
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

      const currentList = this.inquiries$.value;
      const item = currentList.find(x => x.id === id);
      
      if (!item) {
        this.inquiryService.getAllInquiries().subscribe({
          next: (res) => {
            const list = res.data.map(i => this.mapBackendToLocal(i));
            this.inquiries$.next(list);
            const found = list.find(x => x.id === id);
            if (found) {
              this.selectedId = id;
              this.detail = enrichDetail(found);
              if (edit) {
                this.mode = 'edit';
                this.initEditForm(found);
              } else {
                this.mode = 'detail';
              }
            } else {
              this.syncRoute(null, 'list', false);
            }
          }
        });
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
    if (this.query$.value.sortKey !== key) return 'fa-sort';
    return this.query$.value.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

  executeSave(sendEmail: boolean = false): void {
    if (!this.detail || !this.editForm) { this.saveModalOpen = false; return; }
    this.saving = true;

    const payload = {
      status: this.editForm.status,
      priority: this.mapLocalPriorityToBackend(this.editForm.priority),
      staff_response: this.editForm.resolution,
      internal_notes: this.editForm.internalNote,
      category: this.editForm.category,
      send_email: sendEmail
    };

    const mongoId = (this.detail as any)._id;

    this.inquiryService.respondToInquiry(mongoId, payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.saveModalOpen = false;
        this.loadInquiries();
        this.syncRoute(this.selectedId, 'detail', true);
        if (sendEmail) {
          if ((res as any).mailError) {
            alert('Đã lưu dữ liệu nhưng KHÔNG gửi được email. Lỗi: ' + (res as any).mailError);
          } else {
            alert('Đã lưu và gửi phản hồi cho khách hàng thành công!');
          }
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveModalOpen = false;
        console.error('Save failed', err);
        alert('Có lỗi xảy ra khi lưu thông tin: ' + (err.error?.message || err.message));
      }
    });
  }

  sendToCustomer(): void {
    if (!this.detail || !this.editForm) return;
    if (!this.editForm.resolution) {
      alert('Vui lòng nhập hướng giải quyết trước khi gửi!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn lưu và GỬI email phản hồi này cho khách hàng?')) {
      this.executeSave(true);
    }
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
    const item = this.inquiries$.value.find(x => x.id === id);
    if (!item) return;
    const next = nextStatus(item.status);
    if (!next) return;

    this.inquiryService.respondToInquiry((item as any)._id, { status: next }).subscribe({
      next: () => this.loadInquiries(),
      error: (err) => console.error('Advance status failed', err)
    });
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
    
    const item = this.inquiries$.value.find(x => x.id === id);
    if (!item) return;

    this.inquiryService.deleteInquiry((item as any)._id).subscribe({
      next: () => {
        this.loadInquiries();
        if (this.selectedId === id) this.syncRoute(null, 'list', true);
      },
      error: (err) => console.error('Delete failed', err)
    });
  }

  categoryBadgeClass(category: InquiryCategory): string {
    switch (category) {
      case 'order': return 'hb-cat-order';
      case 'product': return 'hb-cat-product';
      case 'warranty': return 'hb-cat-warranty';
      case 'other': return 'hb-cat-other';
      default: return 'hb-cat-other';
    }
  }

  statusBadgeClass(status: InquiryStatus): string {
    switch (status) {
      case 'open': return 'hb-st-new';
      case 'in_progress': return 'hb-st-checking';
      case 'closed': return 'hb-st-done';
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
    case 'open': return 'Mới';
    case 'in_progress': return 'Đang xử lý';
    case 'closed': return 'Đã đóng';
    default: return s;
  }
}

function categoryLabel(c: InquiryCategory): string {
  switch (c) {
    case 'order': return 'Vấn đề đơn hàng';
    case 'product': return 'Tư vấn sản phẩm';
    case 'warranty': return 'Yêu cầu bảo hành';
    case 'other': return 'Góp ý khác';
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
    case 'open': return 'in_progress';
    case 'in_progress': return 'closed';
    case 'closed': return null;
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