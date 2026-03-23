import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, take, takeUntil, finalize, debounceTime } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { EventService } from '../../../services/event-service';
import { ToastService } from '../../../services/toast-service';
import { IEvent } from '../../../../interface';

type EventStatus = 'DRAFT' | 'PUBLISHED';
type Phase = 'upcoming' | 'ongoing' | 'past';
type Mode = 'list' | 'detail' | 'edit';

type SortDir = 'asc' | 'desc';
type SortKey = 'event_code' | 'event_name' | 'start_at' | 'status' | 'registered_count';

interface EventScheduleItem {
  item_id: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
}

interface EventImageItem {
  image_id: string;
  url: string;
  file_name?: string;
  is_cover?: boolean;
  public_id?: string; // backend-ready for cloud storage / MongoDB reference
}

interface EventImages {
  banner: {
    url: string;
    file_name?: string;
    public_id?: string;
  } | null;
  gallery: EventImageItem[];
  coverImageId: string | null;
}

interface EventEntity {
  event_id: string;
  event_code: string;
  event_name: string;
  description: string;

  start_at: string;
  end_at: string;

  location_name: string;
  address: string;
  city: string;

  // legacy
  banner_url: string;
  cover_url?: string;

  status: EventStatus;

  capacity: number;
  registered_count: number;

  highlights: string[];
  schedule: EventScheduleItem[];

  contact_phone?: string;
  contact_email?: string;

  created_at: string;
  updated_at: string;
}

interface EventRowVM {
  stt: number;
  event_id: string;
  event_code: string;
  event_name: string;

  startText: string;
  endText: string;

  locationText: string;
  capacityText: string;

  phase: Phase;
  status: EventStatus;
  isFull: boolean;

  banner_url: string;
}

interface ListVM {
  rows: EventRowVM[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalCount: number;
    ongoingCount: number;
    upcomingCount: number;
  };
  createStep: number;
  mode: Mode;
  selectedId: string | null;
  detail: EventEntity | null;
  editModel: Partial<EventEntity> | null;
}

@Component({
  selector: 'app-management-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmModal],
  templateUrl: './management-events.html',
  styleUrls: ['./management-events.css'],
})
export class ManagementEvents implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private toastService: ToastService,
    private zone: NgZone,
  ) {}

  private searchSubject = new Subject<string>();

  mode: Mode = 'list';
  selectedId: string | null = null;
  detail: EventEntity | null = null;
  editModel: Partial<EventEntity> | null = null;
  createStep$ = new BehaviorSubject<number>(1);
  saving = false;

  // ===== image upload states =====
  bannerPreviewUrl: string | null = null;
  newHighlight = '';
  newScheduleItem: EventScheduleItem = {
    item_id: '',
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    description: '',
  };

  // dirty tracking
  isDirty = false;
  private originalSnapshot = '';
  private pendingDiscardAction: (() => void) | null = null;

  saveModalOpen = false;
  discardModalOpen = false;
  deleteModalOpen = false;
  deleteTargetId: string | null = null;

  // filters
  q = '';
  f_phase: '' | Phase = '';
  f_status: '' | EventStatus = '';
  f_capacity: '' | 'available' | 'full' = '';
  f_from = '';
  f_to = '';

  // paging
  page = 1;
  pageSize = 10;

  // sorting
  sortBy: SortKey = 'start_at';
  sortDir: SortDir = 'desc';

  private _events$ = new BehaviorSubject<EventEntity[]>([]);
  private _tick$ = new BehaviorSubject(0);

  vm$ = combineLatest([this._events$, this._tick$, this.createStep$]).pipe(
    map(([events, _tick, createStep]) => {
      const q = this.q.trim().toLowerCase();
      // user picks date like "2026-06-01" in Vietnam time. 
      // Start of day: "2026-06-01T00:00:00+07:00"
      const fromTime = this.f_from ? new Date(`${this.f_from}T00:00:00+07:00`).getTime() : 0;
      // End of day: "2026-06-01T23:59:59+07:00"
      const toTime = this.f_to ? new Date(`${this.f_to}T23:59:59+07:00`).getTime() : Infinity;

      let filtered = events.filter((e) => {
        const phase = this.computePhase(e.start_at, e.end_at);

        const matchQ =
          !q ||
          e.event_code.toLowerCase().includes(q) ||
          e.event_name.toLowerCase().includes(q) ||
          e.event_id.toLowerCase().includes(q) ||
          e.location_name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q);

        const matchPhase = !this.f_phase || phase === this.f_phase;
        const matchStatus = !this.f_status || e.status === this.f_status;

        const isFull = e.registered_count >= e.capacity;
        let matchCap = true;
        if (this.f_capacity === 'available') matchCap = !isFull;
        if (this.f_capacity === 'full') matchCap = isFull;

        const eventStart = new Date(e.start_at).getTime();
        const eventEnd = new Date(e.end_at).getTime();

        const matchFrom = !this.f_from || eventStart >= fromTime;
        const matchTo = !this.f_to || eventEnd <= toTime;

        return matchQ && matchPhase && matchStatus && matchCap && matchFrom && matchTo;
      });

      filtered = [...filtered].sort((a, b) => this.sortCompare(a, b));

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      const page = Math.min(Math.max(1, this.page), totalPages);

      const start = (page - 1) * this.pageSize;
      const pageItems = filtered.slice(start, start + this.pageSize);

      const rows: EventRowVM[] = pageItems.map((e, idx) => {
        const phase = this.computePhase(e.start_at, e.end_at);
        return {
          stt: start + idx + 1,
          event_id: e.event_id,
          event_code: e.event_code,
          event_name: e.event_name,
          startText: this.fmtDateOnly(e.start_at),
          endText: this.fmtDateOnly(e.end_at),
          locationText: `${e.location_name} · ${e.city}`,
          capacityText: `${e.registered_count}/${e.capacity}`,
          phase,
          status: e.status,
          isFull: e.registered_count >= e.capacity,
          banner_url: e.banner_url,
        };
      });

      const summary = {
        totalCount: events.length,
        ongoingCount: events.filter((e) => this.computePhase(e.start_at, e.end_at) === 'ongoing')
          .length,
        upcomingCount: events.filter((e) => this.computePhase(e.start_at, e.end_at) === 'upcoming')
          .length,
      };

      const vm: ListVM = {
        rows,
        total,
        page,
        pageSize: this.pageSize,
        totalPages,
        summary,
        createStep,
        mode: this.mode,
        selectedId: this.selectedId,
        detail: this.detail,
        editModel: this.editModel,
      };
      return vm;
    }),
  );

  ngOnInit(): void {
    this.bindRouteState();
    this.loadEvents();
    this.initSearchDebounce();
  }

  private initSearchDebounce(): void {
    this.searchSubject.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((v) => {
      this.q = v;
      this.page = 1;
      this.refreshList();
    });
  }

  private loadEvents(): void {
    this.eventService
      .getAllEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const entities = res.data.map((e) => this.mapToEntity(e));
          this._events$.next(entities);
        },
        error: (err) => {
          console.error('Failed to load events', err);
        },
      });
  }

  private mapToEntity(e: IEvent): EventEntity {
    const entity: EventEntity = {
      event_id: e._id,
      event_code: e.slug || '',
      event_name: e.title || '',
      description: e.description || '',
      start_at: e.date_range?.startDate ? new Date(e.date_range.startDate).toISOString() : '',
      end_at: e.date_range?.endDate ? new Date(e.date_range.endDate).toISOString() : '',
      location_name: e.location?.name || '',
      address: e.location?.address || '',
      city: e.location?.city || '',
      banner_url: e.images?.find((img) => img.is_main)?.url_image || e.images?.[0]?.url_image || '',
      cover_url: '', // Legacy, not used with new image handling
      status: this.mapStatusFromBackend(e.status),
      capacity: e.registration?.maxSlot || 0,
      registered_count: e.registration?.registeredCount || 0,
      highlights: e.hightlight_des || [],
      schedule: (e.timeline_event || []).map((t, idx) => ({
        item_id: `S${idx}`,
        start_time: t.start_time,
        end_time: t.end_time,
        title: t.title,
        description: t.description,
      })),
      contact_phone: '',
      contact_email: '',
      created_at: (e as any).createdAt || '',
      updated_at: (e as any).updatedAt || '',
    };
    return entity;
  }

  private mapToIEvent(entity: Partial<EventEntity>): IEvent {
    // For mapping back to backend format
    const res: any = {
      title: entity.event_name!,
      slug: entity.event_code!,
      description: entity.description || '',
      images: entity.banner_url ? [{ url_image: entity.banner_url, is_main: true }] : [],
      category: 'General',
      hightlight_des: entity.highlights || [],
      date_range: {
        startDate: new Date(entity.start_at!),
        endDate: new Date(entity.end_at!),
      },
      location: {
        name: entity.location_name || '',
        address: entity.address || '',
        city: entity.city || '',
      },
      timeline_event: (entity.schedule || []).map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        title: s.title,
        description: s.description || '',
      })),
      registration: {
        requireRegister: true,
        isFree: true,
        maxSlot: entity.capacity || 0,
        registeredCount: entity.registered_count || 0,
      },
      status: this.mapStatusToBackend(entity.status!),
    };

    if (entity.event_id && !entity.event_id.startsWith('EVT_')) {
      res._id = entity.event_id;
    }

    return res as IEvent;
  }

  private mapStatusFromBackend(s: string): EventStatus {
    const upperS = (s || '').toUpperCase();
    const valid = ['DRAFT', 'PUBLISHED'];
    if (valid.includes(upperS)) return upperS as EventStatus;
    // Fallback for legacy data
    if (upperS === 'UPCOMING' || upperS === 'ONGOING' || upperS === 'ENDED') return 'PUBLISHED';
    return 'DRAFT';
  }

  private mapStatusToBackend(s: EventStatus): string {
    return s || 'DRAFT';
  }

  ngOnDestroy(): void {
    this.revokeAllPreviews();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const isEdit = qp.get('edit') === 'true';

      const incomingId = id ? String(id) : null;

      if (!incomingId) {
        this.mode = 'list';
        this.selectedId = null;
        this.detail = null;
        this.editModel = null;
        this.isDirty = false;
        this.originalSnapshot = '';
        this.createStep$.next(1);
        this.pendingNewEvent = null;
        return;
      }

      if (incomingId === 'NEW') {
        this.selectedId = 'NEW';
        if (!this.pendingNewEvent) {
          this.pendingNewEvent = this.buildFreshDraft();
        }
        this.detail = this.pendingNewEvent;
        this.mode = 'edit';
        this.initEditModel(this.pendingNewEvent);
        this.refreshList();
        return;
      }

      const e = this._events$.value.find((x) => x.event_id === incomingId) || null;
      if (!e) {
        this.syncRoute(null, 'list', false);
        return;
      }

      this.selectedId = incomingId;
      this.detail = e;

      if (isEdit) {
        this.mode = 'edit';
        this.initEditModel(e);
      } else {
        this.mode = 'detail';
        this.editModel = null;
        this.resetUploadsState();
        this.isDirty = false;
        this.originalSnapshot = '';
      }
      this.refreshList();
    });
  }

  private syncRoute(id: string | null, mode: Mode, push: boolean): void {
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

  private initEditModel(e: EventEntity) {
    this.editModel = {
      event_name: e.event_name,
      event_code: e.event_code,
      description: e.description,
      start_at: this.isoToDateOnly(e.start_at),
      end_at: this.isoToDateOnly(e.end_at),
      location_name: e.location_name,
      address: e.address,
      city: e.city,
      capacity: e.capacity,
      status: e.status,
      registered_count: e.registered_count,
      highlights: [...(e.highlights || [])],
      schedule: JSON.parse(JSON.stringify(e.schedule || [])),
      contact_phone: e.contact_phone,
      contact_email: e.contact_email,
      banner_url: e.banner_url,
    };

    this.resetUploadsState();
    this.bannerPreviewUrl = e.banner_url;

    this.originalSnapshot = JSON.stringify(this.buildDirtyPayload());
    this.isDirty = false;
  }

  markDirty() {
    this.isDirty = JSON.stringify(this.buildDirtyPayload()) !== this.originalSnapshot;
  }

  private buildDirtyPayload() {
    return {
      editModel: this.editModel,
      bannerPreviewUrl: this.bannerPreviewUrl,
    };
  }

  // ===== filters =====
  onChangeQ(v: string) {
    this.searchSubject.next(v);
  }

  onChangePhase(v: '' | Phase) {
    this.f_phase = v;
    this.page = 1;
    this.refreshList();
  }

  onChangeStatus(v: '' | EventStatus) {
    this.f_status = v;
    this.page = 1;
    this.refreshList();
  }

  onChangeFrom(v: string) {
    this.f_from = v;
    this.page = 1;
    this.refreshList();
  }

  onChangeTo(v: string) {
    this.f_to = v;
    this.page = 1;
    this.refreshList();
  }

  onChangePageSize(v: number) {
    this.pageSize = Number(v);
    this.page = 1;
    this.refreshList();
  }

  resetFilters() {
    this.q = '';
    this.f_phase = '';
    this.f_status = '';
    this.f_capacity = '';
    this.f_from = '';
    this.f_to = '';
    this.page = 1;
    this.pageSize = 10;
    this.sortBy = 'start_at';
    this.sortDir = 'desc';
    this.refreshList();
  }

  setPage(p: number) {
    this.page = p;
    this.refreshList();
  }

  toggleSort(key: SortKey) {
    if (this.sortBy === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortBy = key;
      this.sortDir = 'asc';
    }
    this.refreshList();
  }

  sortIcon(key: SortKey): string {
    if (this.sortBy !== key) return 'fa-sort';
    return this.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  refreshList() {
    this._tick$.next(this._tick$.value + 1);
  }

  exportCsvSnapshot() {
    this.vm$
      .pipe(
        take(1),
        map((vm) => vm.rows),
      )
      .subscribe((rows) => {
        const header = [
          'STT',
          'Event ID',
          'Code',
          'Name',
          'Start',
          'End',
          'Location',
          'Capacity',
          'Phase',
          'Status',
        ];
        const lines = rows.map((r) =>
          [
            r.stt,
            r.event_id,
            r.event_code,
            r.event_name,
            r.startText,
            r.endText,
            r.locationText,
            r.capacityText,
            r.phase,
            r.status,
          ]
            .map(csvEsc)
            .join(','),
        );
        const csv = [header.join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  openDetail(id: string) {
    this.createStep$.next(2);
    this.syncRoute(id, 'detail', true);
  }

  openEdit(id: string) {
    this.createStep$.next(1);
    this.syncRoute(id, 'edit', true);
  }

  onHeaderBack() {
    if (this.mode === 'edit') {
      this.backToDetail();
      return;
    }
    this.backToList();
  }

  backToList() {
    this.createStep$.next(1);
    this.attemptLeave(() => {
      this.syncRoute(null, 'list', true);
    });
  }

  goList() {
    this.backToList();
  }

  enterEdit() {
    if (!this.detail) return;
    this.createStep$.next(1);
    this.syncRoute(this.detail.event_id, 'edit', true);
  }

  backToDetail() {
    if (!this.selectedId) {
      this.backToList();
      return;
    }
    this.attemptLeave(() => {
      this.syncRoute(this.selectedId, 'detail', true);
    });
  }

  cancelEdit() {
    if (this.selectedId === 'NEW') {
      this.backToList();
    } else {
      this.backToDetail();
    }
  }

  private attemptLeave(action: () => void) {
    if (!this.isDirty) {
      action();
      return;
    }
    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
  }

  onConfirmDiscard() {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.editModel = null;
    this.resetUploadsState();
    this.isDirty = false;
    this.originalSnapshot = '';
    action?.();
  }

  onCancelDiscard() {
    this.discardModalOpen = false;
    this.pendingDiscardAction = null;
  }

  private pendingNewEvent: EventEntity | null = null;

  private buildFreshDraft(): EventEntity {
    const now = Date.now();
    const id = `EVT_${cryptoId().slice(0, 6).toUpperCase()}`;
    const code = `NEW_${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;

    const startISO = new Date(now + 1000 * 60 * 60 * 24).toISOString();
    const endISO = new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString();

    return {
      event_id: id,
      event_code: code,
      event_name: 'Sự kiện mới',
      description: '',
      start_at: startISO,
      end_at: endISO,
      location_name: 'Hà Nội',
      address: '',
      city: 'Hà Nội',
      banner_url: '',
      cover_url: '',
      status: 'DRAFT',
      capacity: 100,
      registered_count: 0,
      highlights: [],
      schedule: [],
      contact_phone: '',
      contact_email: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  onSelectEvent(id: string) {
    this.syncRoute(id, 'detail', true);
  }

  createNewEvent() {
    this.pendingNewEvent = this.buildFreshDraft();
    this.syncRoute('NEW', 'edit', true);
  }

  deleteEvent(id: string) {
    this.deleteTargetId = id;
    this.deleteModalOpen = true;
  }

  onCancelDelete() {
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
  }

  onConfirmDelete() {
    const id = this.deleteTargetId;
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
    if (!id) return;

    this.createStep$.next(1);
    this.eventService
      .deleteEvent(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Đã xóa sự kiện');
          const next = this._events$.value.filter((x) => x.event_id !== id);
          this._events$.next(next);
          this.refreshList();
          if (this.selectedId === id) this.backToList();
        },
        error: (err) => {
          this.toastService.error('Lỗi khi xóa sự kiện: ' + (err.error?.message || err.message));
          console.error('Failed to delete event', err);
        },
      });
  }

  // ===== banner =====
  onBannerPicked(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.zone.run(() => {
        this.bannerPreviewUrl = reader.result as string;
        this.markDirty();
        this.refreshList();
      });
    };
    reader.readAsDataURL(file);
  }

  removeBannerPicked() {
    this.bannerPreviewUrl = null;
    this.markDirty();
  }

  private resetUploadsState() {
    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);
    this.bannerPreviewUrl = null;
  }

  private revokeAllPreviews() {
    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);
  }

  private revokePreviewIfObjectUrl(url: string | null) {
    if (!url) return;
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  saveEdit() {
    if (!this.detail || !this.editModel) return;
    this.executeSave(); // Không hỏi confirm, chuyển thẳng sang bước 2
  }

  onCancelSave() {
    this.saveModalOpen = false;
  }

  executeSave() {
    if (!this.detail || !this.editModel || this.saving) {
      this.saveModalOpen = false;
      return;
    }
    this.saving = true;

    const patched: EventEntity = {
      ...this.detail,
      ...this.editModel,

      start_at: dateOnlyToISO(
        String(this.editModel.start_at || this.isoToDateOnly(this.detail.start_at)),
      ),
      end_at: dateOnlyToISO(
        String(this.editModel.end_at || this.isoToDateOnly(this.detail.end_at)),
        true,
      ),

      banner_url: this.bannerPreviewUrl || this.detail.banner_url,
      cover_url: '', // Not used with new image handling

      updated_at: new Date().toISOString(),
    } as EventEntity;

    if (patched.capacity! < patched.registered_count) {
      patched.capacity = patched.registered_count;
    }

    const dataToSave = this.mapToIEvent(patched);

    if (this.selectedId === 'NEW') {
      this.eventService.createNewEvent(dataToSave).subscribe({
        next: (res) => {
          this.toastService.success('Đã tạo sự kiện mới thành công');
          const newEntity = this.mapToEntity(res.data);
          this._events$.next([newEntity, ...this._events$.value]);
          this.finalizeSave(newEntity);
        },
        error: (err) => {
          this.toastService.error('Không thể tạo sự kiện: ' + (err.error?.message || err.message));
          console.error('Create failed', err);
        },
      }).add(() => this.saving = false);
    } else {
      this.eventService.updateEvent(this.selectedId!, dataToSave).subscribe({
        next: (res) => {
          this.toastService.success('Đã cập nhật sự kiện thành công');
          const updatedEntity = this.mapToEntity(res.data);
          const all = this._events$.value.map((x) =>
            x.event_id === updatedEntity.event_id ? updatedEntity : x,
          );
          this._events$.next(all);
          this.finalizeSave(updatedEntity);
        },
        error: (err) => {
          this.toastService.error('Cập nhật thất bại: ' + (err.error?.message || err.message));
          console.error('Update failed', err);
        },
      }).add(() => this.saving = false);
    }
  }

  private finalizeSave(entity: EventEntity) {
    this.detail = entity;
    this.editModel = null;
    this.saveModalOpen = false;
    this.pendingNewEvent = null;

    this.resetUploadsState();
    this.refreshList();
    this.createStep$.next(1);
    this.syncRoute(entity.event_id, 'detail', true);
  }

  publishEvent() {
    if (!this.detail || this.saving) return;
    this.saving = true;
    const patched = {
      ...this.detail,
      status: 'PUBLISHED' as EventStatus,
      updated_at: new Date().toISOString(),
    };

    const dataToSave = this.mapToIEvent(patched);
    this.eventService.updateEvent(patched.event_id, dataToSave).subscribe({
      next: (res) => {
        this.toastService.success('Đã xuất bản sự kiện thành công');
        const updatedEntity = this.mapToEntity(res.data);
        const all = this._events$.value.map((x) =>
          x.event_id === updatedEntity.event_id ? updatedEntity : x,
        );
        this._events$.next(all);
        this.detail = updatedEntity;
        this.createStep$.next(1);
        this.refreshList();
      },
      error: (err) => {
        this.toastService.error('Xuất bản thất bại: ' + (err.error?.message || err.message));
        console.error('Publish failed', err);
      },
    }).add(() => (this.saving = false));
  }

  stopEvent(e: MouseEvent) {
    e.stopPropagation();
  }

  // ===== Edit Actions =====
  addHighlight() {
    const text = this.newHighlight.trim();
    if (!text || !this.editModel) return;
    if (!this.editModel.highlights) this.editModel.highlights = [];
    this.editModel.highlights.push(text);
    this.newHighlight = '';
    this.markDirty();
  }

  removeHighlight(idx: number) {
    if (!this.editModel?.highlights) return;
    this.editModel.highlights.splice(idx, 1);
    this.markDirty();
  }

  addScheduleItem() {
    const item = { ...this.newScheduleItem, item_id: cryptoId() };
    if (!item.title.trim() || !this.editModel) return;
    if (!this.editModel.schedule) this.editModel.schedule = [];
    this.editModel.schedule.push(item);
    this.newScheduleItem = {
      item_id: '',
      start_time: '09:00',
      end_time: '10:00',
      title: '',
      description: '',
    };
    this.markDirty();
  }

  removeScheduleItem(idx: number) {
    if (!this.editModel?.schedule) return;
    this.editModel.schedule.splice(idx, 1);
    this.markDirty();
  }



  phaseLabel(p: Phase) {
    if (p === 'ongoing') return 'Đang diễn ra';
    if (p === 'upcoming') return 'Sắp diễn ra';
    return 'Đã qua';
  }

  statusLabel(s: EventStatus) {
    switch (s) {
      case 'DRAFT':      return 'Bản nháp';
      case 'PUBLISHED':  return 'Đang mở';
      default:           return 'Bản nháp';
    }
  }

  statusBadgeClass(s: EventStatus) {
    if (s === 'PUBLISHED') return 'hb-st-active';
    return 'hb-st-frozen'; // DRAFT
  }

  unpublishEvent(id: string) {
    const entity = this._events$.value.find((e) => e.event_id === id);
    if (!entity) return;
    const patched = { ...entity, status: 'DRAFT' as EventStatus };
    const dataToSave = this.mapToIEvent(patched);
    this.saving = true;
    this.eventService.updateEvent(id, dataToSave)
      .pipe(take(1), finalize(() => (this.saving = false)))
      .subscribe({
        next: (res) => {
          const updated = this.mapToEntity(res.data);
          this._events$.next(
            this._events$.value.map((e) => (e.event_id === id ? updated : e))
          );
          if (this.detail?.event_id === id) this.detail = updated;
          this.toastService.success('Đã thu hồi về bản nháp!');
          this.refreshList();
        },
        error: () => this.toastService.error('Không thể thu hồi!'),
      });
  }

  phaseBadgeClass(p: Phase) {
    if (p === 'ongoing') return 'hb-st-active';
    if (p === 'upcoming') return 'hb-st-frozen';
    return 'hb-st-expired';
  }

  fmtDateOnly(iso: string) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return iso;
    }
  }

  fmtDateRange(startISO: string, endISO: string) {
    return `${this.fmtDateOnly(startISO)} → ${this.fmtDateOnly(endISO)}`;
  }

  get dateError(): string | null {
    if (!this.editModel?.start_at || !this.editModel?.end_at) return null;
    const s = new Date(this.editModel.start_at).getTime();
    const e = new Date(this.editModel.end_at).getTime();
    if (s > e) return 'Ngày kết thúc không được trước ngày bắt đầu';
    return null;
  }

  get isFormValid(): boolean {
    const em = this.editModel;
    if (!em) return false;
    return !!em.event_name?.trim() && !!em.start_at && !!em.end_at && !this.dateError;
  }

  fmtTimeRange(it: EventScheduleItem) {
    return `${it.start_time} - ${it.end_time}`;
  }

  computePhase(startISO: string, endISO: string): Phase {
    const now = Date.now();
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (now < s) return 'upcoming';
    if (now > e) return 'past';
    return 'ongoing';
  }

  private isoToDateOnly(iso: string) {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private sortCompare(a: EventEntity, b: EventEntity) {
    const dir = this.sortDir === 'asc' ? 1 : -1;

    const get = (x: EventEntity) => {
      switch (this.sortBy) {
        case 'event_code':
          return x.event_code.toLowerCase();
        case 'event_name':
          return x.event_name.toLowerCase();
        case 'start_at':
          return new Date(x.start_at).getTime();
        case 'status':
          return x.status;
        case 'registered_count':
          return x.registered_count;
      }
    };

    const va = get(a) as any;
    const vb = get(b) as any;

    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  }
}

function csvEsc(v: any) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cryptoId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function dateOnlyToISO(yyyyMmDd: string, endOfDay = false) {
  const t = endOfDay ? '23:59:59' : '00:00:00';
  const d = new Date(`${yyyyMmDd}T${t}`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function seedEvents(): EventEntity[] {
  const now = Date.now();

  const e1: EventEntity = {
    event_id: 'EVT_0001',
    event_code: 'EXPO2025',
    event_name: 'Interior Art Expo 2025',
    description: 'Triển lãm nghệ thuật nội thất & thiết kế đương đại.',
    start_at: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(),
    end_at: new Date(now + 1000 * 60 * 60 * 24 * 8).toISOString(),
    location_name: 'SECC',
    address: 'Quận 7',
    city: 'TP.HCM',
    banner_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
    cover_url: '',
    status: 'PUBLISHED',
    capacity: 200,
    registered_count: 47,
    highlights: ['Hơn 100 thương hiệu tham gia', 'Workshop thực tế'],
    schedule: [],
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  };

  const e2: EventEntity = {
    event_id: 'EVT_0002',
    event_code: 'TODAYSHOW',
    event_name: 'Today Showcase',
    description: 'Sự kiện demo hiển thị date-only.',
    start_at: new Date(now + 1000 * 60 * 60 * 24 * 1).toISOString(),
    end_at: new Date(now + 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 60 * 2).toISOString(),
    location_name: 'HomeBase Studio',
    address: 'Quận 2',
    city: 'TP.HCM',
    banner_url:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=60',
    cover_url: '',
    status: 'PUBLISHED',
    capacity: 120,
    registered_count: 88,
    highlights: ['Check-in nhanh', 'Mini workshop', 'Ưu đãi trong ngày'],
    schedule: [
      { item_id: 'S1', start_time: '18:00', end_time: '18:30', title: 'Check-in', description: '' },
      { item_id: 'S2', start_time: '18:30', end_time: '20:00', title: 'Workshop', description: '' },
    ],
    contact_phone: '(+84) 901 234 567',
    contact_email: 'events@homebase.vn',
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
  };

  const e3: EventEntity = {
    event_id: 'EVT_0003',
    event_code: 'PRIVATE01',
    event_name: 'Private VIP Night',
    description: 'Sự kiện private dành cho khách VIP.',
    start_at: new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString(),
    end_at: new Date(now + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 5).toISOString(),
    location_name: 'HomeBase Gallery',
    address: 'Quận 1',
    city: 'TP.HCM',
    banner_url:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=60',
    cover_url: '',
    status: 'DRAFT',
    capacity: 60,
    registered_count: 0,
    highlights: ['Welcome drink', 'Private tour', 'Gift set'],
    schedule: [
      { item_id: 'S1', start_time: '19:00', end_time: '20:00', title: 'Welcome', description: '' },
    ],
    contact_phone: '(+84) 901 234 567',
    contact_email: 'vip@homebase.vn',
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 20).toISOString(),
  };

  return [e1, e2, e3];
}
