import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, map, take, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type EventStatus = 'draft' | 'published' | 'paused' | 'ended' | 'cancelled';
type EventVisibility = 'public' | 'private';
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

  visibility: EventVisibility;
  status: EventStatus;

  capacity: number;
  registered_count: number;

  highlights: string[];
  schedule: EventScheduleItem[];

  contact_phone?: string;
  contact_email?: string;

  created_at: string;
  updated_at: string;

  // backend-ready
  images?: EventImages;
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
  ) {}

  mode: Mode = 'list';
  selectedId: string | null = null;
  detail: EventEntity | null = null;
  editModel: Partial<EventEntity> | null = null;

  // ===== image upload states =====
  bannerFile: File | null = null;
  bannerPreviewUrl: string | null = null;

  // local editor gallery state
  editGallery: EventImageItem[] = [];

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
  f_from = '';
  f_to = '';

  // paging
  page = 1;
  pageSize = 10;

  // sorting
  sortBy: SortKey = 'start_at';
  sortDir: SortDir = 'desc';

  private _events$ = new BehaviorSubject<EventEntity[]>(seedEvents());
  private _tick$ = new BehaviorSubject(0);

  vm$ = combineLatest([this._events$, this._tick$]).pipe(
    map(([events]) => {
      const q = this.q.trim().toLowerCase();
      const fromISO = this.f_from ? dateOnlyToISO(this.f_from) : '';
      const toISO = this.f_to ? dateOnlyToISO(this.f_to, true) : '';

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

        const matchFrom = !fromISO || new Date(e.start_at).toISOString() >= fromISO;
        const matchTo = !toISO || new Date(e.end_at).toISOString() <= toISO;

        return matchQ && matchPhase && matchStatus && matchFrom && matchTo;
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
          banner_url: this.getBannerUrl(e),
        };
      });

      const summary = {
        totalCount: events.length,
        ongoingCount: events.filter((e) => this.computePhase(e.start_at, e.end_at) === 'ongoing')
          .length,
        upcomingCount: events.filter((e) => this.computePhase(e.start_at, e.end_at) === 'upcoming')
          .length,
      };

      const vm: ListVM = { rows, total, page, pageSize: this.pageSize, totalPages, summary };
      return vm;
    }),
  );

  ngOnInit(): void {
    this.bindRouteState();
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
        this.resetUploadsState();
        this.isDirty = false;
        this.originalSnapshot = '';
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
      visibility: e.visibility,
      registered_count: e.registered_count,
      highlights: [...(e.highlights || [])],
      schedule: JSON.parse(JSON.stringify(e.schedule || [])),
      contact_phone: e.contact_phone,
      contact_email: e.contact_email,
      images: deepClone(this.normalizeImages(e)),
    };

    this.resetUploadsState();
    this.bannerPreviewUrl = this.getBannerUrl(e);
    this.editGallery = deepClone(this.normalizeImages(e).gallery);

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
      editGallery: this.editGallery,
    };
  }

  // ===== filters =====
  onChangeQ(v: string) {
    this.q = v;
    this.page = 1;
    this.refreshList();
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

  private refreshList() {
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
    this.syncRoute(id, 'detail', true);
  }

  openEdit(id: string) {
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
    this.attemptLeave(() => {
      this.syncRoute(null, 'list', true);
    });
  }

  enterEdit() {
    if (!this.detail) return;
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
    this.backToDetail();
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

  createNewEvent() {
    const now = Date.now();
    const id = `EVT_${cryptoId().slice(0, 6).toUpperCase()}`;
    const code = `NEW_${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;

    const startISO = new Date(now + 1000 * 60 * 60 * 24).toISOString();
    const endISO = new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString();

    const draft: EventEntity = {
      event_id: id,
      event_code: code,
      event_name: 'Sự kiện mới',
      description: '',
      start_at: startISO,
      end_at: endISO,
      location_name: 'HomeBase',
      address: '',
      city: 'TP.HCM',
      banner_url:
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
      cover_url: '',
      visibility: 'public',
      status: 'draft',
      capacity: 50,
      registered_count: 0,
      highlights: [],
      schedule: [],
      contact_phone: '',
      contact_email: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: {
        banner: {
          url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
        },
        gallery: [],
        coverImageId: null,
      },
    };

    this._events$.next([draft, ...this._events$.value]);
    this.refreshList();
    this.openEdit(draft.event_id);
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

    const next = this._events$.value.filter((x) => x.event_id !== id);
    this._events$.next(next);
    this.refreshList();

    if (this.selectedId === id) this.backToList();
  }

  // ===== banner =====
  onBannerPicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);

    this.bannerFile = file;
    this.bannerPreviewUrl = URL.createObjectURL(file);

    if (this.editModel?.images) {
      this.editModel.images.banner = {
        url: this.bannerPreviewUrl,
        file_name: file.name,
      };
    }

    this.markDirty();
    input.value = '';
  }

  removeBannerPicked() {
    this.bannerFile = null;
    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);
    this.bannerPreviewUrl = null;

    if (this.editModel?.images) {
      this.editModel.images.banner = null;
    }

    this.markDirty();
  }

  // ===== gallery =====
  onGalleryPicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const preview = URL.createObjectURL(file);
      const item: EventImageItem = {
        image_id: cryptoId(),
        url: preview,
        file_name: file.name,
        is_cover: false,
      };
      this.editGallery.push(item);
    });

    if (this.editModel?.images) {
      this.editModel.images.gallery = this.editGallery;
      if (!this.editModel.images.coverImageId && this.editGallery.length > 0) {
        this.editModel.images.coverImageId = this.editGallery[0].image_id;
        this.syncCoverFlags();
      }
    }

    this.markDirty();
    input.value = '';
  }

  removeGalleryImage(i: number) {
    const img = this.editGallery[i];
    if (!img) return;

    this.revokePreviewIfObjectUrl(img.url);
    const removedId = img.image_id;

    this.editGallery.splice(i, 1);

    if (this.editModel?.images) {
      this.editModel.images.gallery = this.editGallery;

      if (this.editModel.images.coverImageId === removedId) {
        this.editModel.images.coverImageId = this.editGallery[0]?.image_id ?? null;
      }

      this.syncCoverFlags();
    }

    this.markDirty();
  }

  setCoverImage(imageId: string) {
    if (!this.editModel?.images) return;
    this.editModel.images.coverImageId = imageId;
    this.syncCoverFlags();
    this.markDirty();
  }

  private syncCoverFlags() {
    if (!this.editModel?.images) return;
    const coverId = this.editModel.images.coverImageId;
    this.editGallery = this.editGallery.map((img) => ({
      ...img,
      is_cover: img.image_id === coverId,
    }));
    this.editModel.images.gallery = this.editGallery;
  }

  private normalizeImages(e: EventEntity): EventImages {
    if (e.images) {
      return {
        banner: e.images.banner ?? (e.banner_url ? { url: e.banner_url } : null),
        gallery: e.images.gallery ?? [],
        coverImageId: e.images.coverImageId ?? null,
      };
    }

    return {
      banner: e.banner_url ? { url: e.banner_url } : null,
      gallery: e.cover_url
        ? [
            {
              image_id: cryptoId(),
              url: e.cover_url,
              is_cover: true,
            },
          ]
        : [],
      coverImageId: null,
    };
  }

  getBannerUrl(e: EventEntity): string {
    return e.images?.banner?.url || e.banner_url || '';
  }

  private resetUploadsState() {
    this.bannerFile = null;
    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);
    this.bannerPreviewUrl = null;

    this.editGallery.forEach((x) => this.revokePreviewIfObjectUrl(x.url));
    this.editGallery = [];
  }

  private revokeAllPreviews() {
    this.revokePreviewIfObjectUrl(this.bannerPreviewUrl);
    this.editGallery.forEach((x) => this.revokePreviewIfObjectUrl(x.url));
  }

  private revokePreviewIfObjectUrl(url: string | null) {
    if (!url) return;
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  saveEdit() {
    if (!this.detail || !this.editModel) return;
    this.saveModalOpen = true;
  }

  onCancelSave() {
    this.saveModalOpen = false;
  }

  executeSave() {
    if (!this.detail || !this.editModel) {
      this.saveModalOpen = false;
      return;
    }

    const normalizedImages: EventImages = {
      banner:
        this.editModel.images?.banner ??
        (this.bannerPreviewUrl ? { url: this.bannerPreviewUrl } : null),
      gallery: this.editGallery,
      coverImageId: this.editModel.images?.coverImageId ?? null,
    };

    const coverImg =
      normalizedImages.gallery.find((x) => x.image_id === normalizedImages.coverImageId) ?? null;

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

      banner_url: normalizedImages.banner?.url || this.bannerPreviewUrl || this.detail.banner_url,
      cover_url: coverImg?.url || '',
      images: normalizedImages,

      updated_at: new Date().toISOString(),
    } as EventEntity;

    if (patched.capacity! < patched.registered_count) {
      patched.capacity = patched.registered_count;
    }

    const all = this._events$.value.map((x) => (x.event_id === patched.event_id ? patched : x));
    this._events$.next(all);

    this.detail = patched;
    this.editModel = null;
    this.saveModalOpen = false;

    this.resetUploadsState();
    this.refreshList();
    this.syncRoute(patched.event_id, 'detail', true);
  }

  stopEvent(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  addHighlight() {
    if (!this.editModel) return;
    const list = (this.editModel.highlights ?? []) as string[];
    list.push('Highlight mới...');
    this.editModel.highlights = list;
    this.markDirty();
  }

  removeHighlight(i: number) {
    if (!this.editModel) return;
    const list = (this.editModel.highlights ?? []) as string[];
    list.splice(i, 1);
    this.editModel.highlights = list;
    this.markDirty();
  }

  addScheduleItem() {
    if (!this.editModel) return;
    const list = (this.editModel.schedule ?? []) as EventScheduleItem[];
    list.push({
      item_id: cryptoId(),
      start_time: '09:00',
      end_time: '10:00',
      title: 'Mục chương trình...',
      description: '',
    });
    this.editModel.schedule = list;
    this.markDirty();
  }

  removeScheduleItem(i: number) {
    if (!this.editModel) return;
    const list = (this.editModel.schedule ?? []) as EventScheduleItem[];
    list.splice(i, 1);
    this.editModel.schedule = list;
    this.markDirty();
  }

  phaseLabel(p: Phase) {
    if (p === 'ongoing') return 'Đang diễn ra';
    if (p === 'upcoming') return 'Sắp diễn ra';
    return 'Đã qua';
  }

  statusLabel(s: EventStatus) {
    switch (s) {
      case 'draft':
        return 'Nháp';
      case 'published':
        return 'Đang mở';
      case 'paused':
        return 'Tạm dừng';
      case 'ended':
        return 'Đã kết thúc';
      case 'cancelled':
        return 'Đã hủy';
    }
  }

  statusBadgeClass(s: EventStatus) {
    if (s === 'published') return 'hb-st-active';
    if (s === 'paused') return 'hb-st-paused';
    if (s === 'draft') return 'hb-st-frozen';
    return 'hb-st-expired';
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
    banner_url:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
    cover_url:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=60',
    visibility: 'public',
    status: 'published',
    capacity: 200,
    registered_count: 47,
    highlights: [
      'Hơn 100 thương hiệu nội thất cao cấp tham gia',
      'Triển lãm các bộ sưu tập nội thất độc quyền',
      'Workshop thiết kế không gian sống hiện đại',
    ],
    schedule: [
      { item_id: 'S1', start_time: '09:00', end_time: '10:00', title: 'Khai mạc', description: '' },
      {
        item_id: 'S2',
        start_time: '10:00',
        end_time: '12:00',
        title: 'Tham quan',
        description: '',
      },
    ],
    contact_phone: '(+84) 901 234 567',
    contact_email: 'events@homebase.vn',
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    images: {
      banner: {
        url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
      },
      gallery: [
        {
          image_id: 'IMG_001',
          url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=60',
          is_cover: true,
        },
        {
          image_id: 'IMG_002',
          url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=60',
        },
      ],
      coverImageId: 'IMG_001',
    },
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
    visibility: 'public',
    status: 'published',
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
    images: {
      banner: {
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=60',
      },
      gallery: [],
      coverImageId: null,
    },
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
    visibility: 'private',
    status: 'draft',
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
    images: {
      banner: {
        url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=60',
      },
      gallery: [],
      coverImageId: null,
    },
  };

  return [e1, e2, e3];
}
      gallery: (item.images || []).map((url: string) => ({ image_id: url, url, is_cover: false })),
      coverImageId: item.images?.[0] || null
    }
  };
}

function dateOnlyToISO(d: string, endOfDay = false): string {
  if (!d) return '';
  return endOfDay ? `${d}T23:59:59.000Z` : `${d}T00:00:00.000Z`;
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 11);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function csvEsc(s: any): string {
  const v = String(s ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replaceAll('"', '""')}"`;
  }
  return v;
}
