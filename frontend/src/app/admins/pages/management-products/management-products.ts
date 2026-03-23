import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  takeUntil,
  lastValueFrom,
} from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type ProductId = string;
type VariantId = string;
type PageMode = 'list' | 'detail' | 'edit';

interface Product {
  product_id: ProductId;
  product_name: string;
  brand_name: string;
  description: string;
  discount_percent: number;
  is_assembly: boolean;
  warranty: number;
  tags: string[];
  image_url: string[];
  inventoryTotal: number;
  priceMin: number;
  ratingAvg: number;
}

interface ProductVariant {
  product_variant_id: VariantId;
  product_id: ProductId;
  sku: string;
  price: number;
  weight: number;
  num_inventory: number;
  num_selled: number;
  designed_by: string;
  rating: number;
  expected_delivery: string;
  is_default: boolean;
}

interface Room {
  name: string;
}

interface ProductRowVM {
  id: ProductId;
  name: string;
  brand: string;
  discountPercent: number;
  warranty: number;
  tags: string[];
  isAssembly: boolean;
  priceMin: number | null;
  inventoryTotal: number;
  ratingAvg: number | null;
  roomLabel: string;
  imageCover: string | null;
  stt: number;
}

interface ListQuery {
  q: string;
  room: string;
  brand: string;
  stock: 'all' | 'in' | 'out' | 'low';
  lowStockThreshold: number;
  minPrice: number | null;
  maxPrice: number | null;
  sortKey: keyof ProductRowVM;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

interface EditForm {
  product_name: string;
  brand_name: string;
  discount_percent: number;
  warranty: number;
  is_assembly: boolean;
  tagsText: string;
  description: string;
}

interface KeyValueEntry {
  key: string;
  value: string;
  image_url?: string;
}

interface VariantEditVM {
  sku: string;
  product_variant_id?: VariantId;
  product_varant_id?: VariantId; // Match HTML typo
  is_default: boolean;
  price: number;
  num_inventory: number;
  num_selled: number;
  rating: number;
  expected_delivery: string;
  weight: number;
  designed_by: string;
  images: { url: string }[];
  componentEntries: KeyValueEntry[];
  measurementEntries: KeyValueEntry[];
}

interface ProductDetailVM {
  product: any;
  variants: any[];
  images: { url: string }[];
  comments: any[];
  inventoryTotal: number;
  soldTotal: number;
  ratingAvg: number;
  priceMin: number;
  priceMax: number;
}

@Component({
  selector: 'app-management-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

    NgIf,
    NgFor,
    DatePipe,
    ConfirmModal,
  ],
  templateUrl: './management-products.html',
  styleUrls: ['./management-products.css'],
})
export class ManagementProducts implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  private products$ = new BehaviorSubject<Product[]>([]);
  private rooms$ = new BehaviorSubject<Room[]>([]);
  private detailSubject$ = new BehaviorSubject<ProductDetailVM | null>(null);

  mode: PageMode = 'list';
  selectedProductId: ProductId | null = null;
  detailTab: 'overview' | 'variants' | 'comments' = 'overview';

  editForm: EditForm | null = null;
  isDirty = false;
  saving = false;
  localSearchTerm = '';
  isCreateMode = false;

  exportRows: ProductRowVM[] = [];
  editVariants: VariantEditVM[] = [];
  editImages: { url: string; isNew?: boolean }[] = [];

  deleteModalOpen = false;
  deleteItemId: string | null = null;
  deleteItemType: 'product' | 'comment' = 'product';
  deleteModalTitle = '';
  deleteModalMessage = '';

  saveModalOpen = false;
  discardModalOpen = false;

  query$ = new BehaviorSubject<ListQuery>({
    q: '',
    room: '',
    brand: '',
    stock: 'all',
    lowStockThreshold: 5,
    minPrice: null,
    maxPrice: null,
    sortKey: 'id',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
  });

  private rowsAll$ = this.products$.pipe(
    map((products) => {
      return products.map((p) => {
        return {
          id: p.product_id,
          name: p.product_name,
          brand: p.brand_name,
          discountPercent: p.discount_percent,
          warranty: p.warranty,
          tags: Array.isArray(p.tags) ? p.tags : [],
          isAssembly: !!p.is_assembly,
          priceMin: p.priceMin || 0,
          inventoryTotal: p.inventoryTotal || 0,
          ratingAvg: p.ratingAvg || 0,
          roomLabel: inferRoomFromProduct(p),
          imageCover: p.image_url && p.image_url.length ? p.image_url[0] : null,
          stt: 0,
        } as ProductRowVM;
      });
    }),
  );

  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      let filtered = rowsAll.slice();

      const q = (query.q || '').trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((r) => {
          const hay = `${r.id} ${r.name} ${r.brand} ${r.tags.join(' ')}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (query.room) filtered = filtered.filter((r) => r.roomLabel === query.room);
      if (query.brand) filtered = filtered.filter((r) => r.brand === query.brand);
      if (query.minPrice != null) {
        filtered = filtered.filter((r) => (r.priceMin ?? 0) >= query.minPrice!);
      }
      if (query.maxPrice != null) {
        filtered = filtered.filter((r) => (r.priceMin ?? 0) <= query.maxPrice!);
      }

      if (query.stock === 'in') filtered = filtered.filter((r) => r.inventoryTotal > 0);
      if (query.stock === 'out') filtered = filtered.filter((r) => r.inventoryTotal <= 0);
      if (query.stock === 'low') {
        filtered = filtered.filter(
          (r) => r.inventoryTotal > 0 && r.inventoryTotal <= query.lowStockThreshold,
        );
      }

      filtered.sort((a, b) => compareByKey(a, b, query.sortKey, query.sortDir));
      this.exportRows = filtered;

      const roomOptions = Array.from(new Set(rowsAll.map((x) => x.roomLabel))).sort((a, b) =>
        a.localeCompare(b),
      );
      const brandOptions = Array.from(new Set(rowsAll.map((x) => x.brand)))
        .filter((b) => b)
        .sort((a, b) => a.localeCompare(b));

      const total = filtered.length;
      const pageSize = Math.max(1, query.pageSize);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = clamp(query.page, 1, totalPages);

      const start = (page - 1) * pageSize;
      const rows = filtered.slice(start, start + pageSize).map((r, i) => ({
        ...r,
        stt: start + i + 1,
      }));

      const summary = {
        totalProducts: rowsAll.length,
        lowStockProducts: rowsAll.filter((r) => r.inventoryTotal <= query.lowStockThreshold).length,
        totalSold: rowsAll.reduce((s, r) => s + (r as any).soldTotal || 0, 0),
      };

      return {
        rows,
        total,
        page,
        pageSize,
        totalPages,
        query,
        roomOptions,
        brandOptions,
        summary,
      };
    }),
  );

  detail$ = this.detailSubject$.asObservable();

  private expandedVariantIds = new Set<string>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    for (const img of this.editImages) {
      if (img.isNew) URL.revokeObjectURL(img.url);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload($event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      $event.preventDefault();
      $event.returnValue = '';
    }
  }

  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const edit = qp.get('edit');
      const incomingId = id ? String(id) : null;
      const incomingMode: PageMode = !incomingId ? 'list' : edit === 'true' ? 'edit' : 'detail';

      const changed = incomingId !== this.selectedProductId || incomingMode !== this.mode;
      if (!changed) return;

      this.selectedProductId = incomingId;
      this.mode = incomingMode;

      if (this.mode === 'edit' || this.mode === 'detail') {
        this.initEditForm(incomingId);
      } else {
        this.clearEditState();
      }

      if (this.mode === 'list') this.detailTab = 'overview';
    });
  }

  private syncRoute(id: string | null, mode: PageMode, push: boolean): void {
    const queryParams: any = {};
    if (id) {
      queryParams.id = id;
      queryParams.edit = mode === 'edit' ? 'true' : null;
    } else {
      queryParams.id = null;
      queryParams.edit = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  loadData(): void {
    this.http
      .get<any>(`${environment.backend_url}/admin/products?size=1000`, { withCredentials: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.products$.next(res.data?.products || []);
          this.rooms$.next([{ name: 'Phòng khách' }, { name: 'Phòng ngủ' }, { name: 'Khác' }]);
        },
        error: (err) => {
          console.error('API Load Error:', err);
          this.products$.next([]);
        },
      });
  }

  patchQuery(patch: Partial<ListQuery>): void {
    const next = { ...this.query$.value, ...patch };
    const changedFilterOrSort =
      patch.q !== undefined ||
      patch.room !== undefined ||
      patch.brand !== undefined ||
      patch.stock !== undefined ||
      patch.lowStockThreshold !== undefined ||
      patch.minPrice !== undefined ||
      patch.maxPrice !== undefined ||
      patch.sortKey !== undefined ||
      patch.sortDir !== undefined ||
      patch.pageSize !== undefined;

    if (changedFilterOrSort && patch.page === undefined) next.page = 1;
    this.query$.next(next);
  }

  resetFilters(): void {
    this.localSearchTerm = '';
    const keepSort = { sortKey: 'id' as any, sortDir: 'asc' as any };
    this.query$.next({
      q: '',
      room: '',
      brand: '',
      stock: 'all',
      lowStockThreshold: 5,
      minPrice: null,
      maxPrice: null,
      ...keepSort,
      page: 1,
      pageSize: 10,
    });
  }

  onSearchChange(val: string): void {
    this.localSearchTerm = val;
    if (val.length === 0 || val.length >= 3) {
      this.patchQuery({ q: val });
    }
  }

  toggleSort(key: ListQuery['sortKey']): void {
    const q = this.query$.value;
    if (q.sortKey === key) {
      this.patchQuery({ sortDir: q.sortDir === 'asc' ? 'desc' : 'asc' });
      return;
    }
    this.patchQuery({ sortKey: key, sortDir: 'asc' });
  }

  isSortKey(key: ListQuery['sortKey']): boolean {
    return this.query$.value.sortKey === key;
  }

  isSortDir(dir: SortDir): boolean {
    return this.query$.value.sortDir === dir;
  }

  sortIcon(key: ListQuery['sortKey']): string {
    const q = this.query$.value;
    if (q.sortKey !== key) return 'fa-sort';
    return q.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  openDetailById(productId: string): void {
    this.syncRoute(productId, 'detail', true);
  }

  openEdit(productId: string): void {
    this.syncRoute(productId, 'edit', true);
  }

  openDetail(row: ProductRowVM): void {
    this.openDetailById(row.id);
  }

  createNewProduct(): void {
    this.syncRoute('new', 'edit', true);
  }

  onHeaderBack(): void {
    if (this.mode === 'edit') {
      this.cancelEdit();
      return;
    }
    this.backToList();
  }

  backToList(): void {
    this.attemptLeave(() => {
      this.clearEditState();
      this.syncRoute(null, 'list', true);
    });
  }

  backToDetail(): void {
    if (!this.selectedProductId || this.selectedProductId === 'new') {
      this.backToList();
      return;
    }
    this.attemptLeave(() => {
      this.clearEditState();
      this.syncRoute(this.selectedProductId, 'detail', true);
    });
  }

  goEdit(): void {
    if (!this.selectedProductId) return;
    this.syncRoute(this.selectedProductId, 'edit', true);
  }

  cancelEdit(): void {
    if (!this.selectedProductId || this.selectedProductId === 'new') {
      this.backToList();
      return;
    }
    this.backToDetail();
  }

  private attemptLeave(action: () => void): void {
    if (!this.isDirty) {
      action();
      return;
    }
    this.discardModalOpen = true;
    (this as any).pendingDiscardAction = action;
  }

  onConfirmDiscard(): void {
    this.discardModalOpen = false;
    const action = (this as any).pendingDiscardAction;
    this.clearEditState();
    action?.();
  }

  onCancelDiscard(): void {
    this.discardModalOpen = false;
  }

  private async initEditForm(productId: string | null): Promise<void> {
    this.editVariants = [];
    this.editImages = [];
    this.isCreateMode = productId === 'new';

    if (!productId) {
      this.detailSubject$.next(null);
      return;
    }

    if (productId === 'new') {
      this.editForm = {
        product_name: '',
        brand_name: '',
        discount_percent: 0,
        warranty: 12,
        is_assembly: false,
        tagsText: '',
        description: '',
      };
      const v0: VariantEditVM = {
        sku: 'SKU-' + Math.random().toString(16).slice(2, 8).toUpperCase(),
        product_variant_id: 'new-v-1',
        product_varant_id: 'new-v-1',
        is_default: true,
        price: 0,
        num_inventory: 0,
        num_selled: 0,
        rating: 0,
        weight: 0,
        designed_by: '',
        expected_delivery: '3-5 days',
        images: [],
        componentEntries: [],
        measurementEntries: [],
      };
      this.editVariants = [v0];
      this.expandedVariantIds.clear();
      this.expandedVariantIds.add(v0.product_varant_id!);
      this.isDirty = false;
      this.detailSubject$.next(null);
      return;
    }

    try {
      const res = await lastValueFrom(
        this.http.get<any>(`${environment.backend_url}/admin/products/${productId}`, { withCredentials: true })
      );
      const data = res.data;
      const p = data.product;

      this.editForm = {
        product_name: p.product_name,
        brand_name: p.brand_name || p.brand || '',
        discount_percent: p.discount_percent || 0,
        warranty: p.warranty || 0,
        is_assembly: !!p.is_assembly,
        tagsText: Array.isArray(p.tags) ? p.tags.join(', ') : '',
        description: p.description || '',
      };

      this.editVariants = data.variants.map((v: any) => {
        const vImages = data.images
          .filter((img: any) => img.product_variant === v._id)
          .map((img: any) => ({ url: img.url }));

        const compEntries: KeyValueEntry[] = [];
        if (v.product_variant_components) {
          Object.entries(v.product_variant_components).forEach(([k, val]: any) => {
            compEntries.push({ key: k, value: val.name || val, image_url: val.image_url });
          });
        }

        const measEntries: KeyValueEntry[] = [];
        if (v.product_variant_measurements) {
          Object.entries(v.product_variant_measurements).forEach(([k, val]: any) => {
            measEntries.push({ key: k, value: String(val) });
          });
        }

        return {
          product_variant_id: v._id,
          product_varant_id: v._id,
          sku: v.sku,
          is_default: !!v.is_default,
          price: v.price || 0,
          num_inventory: v.num_inventory || 0,
          num_selled: v.num_selled || 0,
          rating: v.rating?.average || 0,
          weight: v.weight || 0,
          designed_by: v.designed_by || '',
          expected_delivery: v.expected_delivery || '',
          images: vImages,
          componentEntries: compEntries,
          measurementEntries: measEntries,
        } as VariantEditVM;
      });

      this.editImages = (p.image_url || []).map((url: string) => ({ url }));

      // Detail mapping for template
      const detailVM: ProductDetailVM = {
        product: p,
        variants: data.variants,
        images: (p.image_url || []).map((u: string) => ({ url: u })),
        comments: data.comments || [],
        inventoryTotal: data.variants.reduce((s: number, v: any) => s + (v.num_inventory || 0), 0),
        soldTotal: data.variants.reduce((s: number, v: any) => s + (v.num_selled || 0), 0),
        ratingAvg: data.variants.reduce((s: number, v: any) => s + (v.rating?.average || 0), 0) / (data.variants.length || 1),
        priceMin: Math.min(...data.variants.map((v: any) => v.price || 999999999)),
        priceMax: Math.max(...data.variants.map((v: any) => v.price || 0)),
      };
      this.detailSubject$.next(detailVM);

      this.isDirty = false;
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }

  onEditChange(): void {
    this.isDirty = true;
  }

  isVariantExpanded(id: string | undefined): boolean {
    return !!id && this.expandedVariantIds.has(id);
  }

  toggleVariantExpand(id: string | undefined): void {
    if (!id) return;
    if (this.expandedVariantIds.has(id)) {
      this.expandedVariantIds.delete(id);
    } else {
      this.expandedVariantIds.add(id);
    }
  }

  variantPreviewLabel(v: VariantEditVM): string {
    if (v.componentEntries.length > 0) {
      return v.componentEntries.map(e => `${e.key}: ${e.value}`).join(', ');
    }
    return v.sku || 'Biến thể mới';
  }

  onVariantChange(): void {
    this.isDirty = true;
  }

  addComponentEntry(v: VariantEditVM): void {
    v.componentEntries.push({ key: '', value: '' });
    this.onEditChange();
  }

  removeComponentEntry(v: VariantEditVM, idx: number): void {
    v.componentEntries.splice(idx, 1);
    this.onEditChange();
  }

  addMeasurementEntry(v: VariantEditVM): void {
    v.measurementEntries.push({ key: '', value: '' });
    this.onEditChange();
  }

  removeMeasurementEntry(v: VariantEditVM, idx: number): void {
    v.measurementEntries.splice(idx, 1);
    this.onEditChange();
  }

  async onUploadEntryImage(ev: any, entry: KeyValueEntry): Promise<void> {
    const file = ev.target.files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    entry.image_url = await this.uploadBlob(blobUrl);
    this.onEditChange();
  }

  removeEntryImage(entry: KeyValueEntry): void {
    entry.image_url = undefined;
    this.onEditChange();
  }

  setDefaultVariant(v: VariantEditVM): void {
    this.editVariants.forEach((ev) => (ev.is_default = false));
    v.is_default = true;
    this.onEditChange();
  }

  onUploadImages(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    for (const f of files) {
      const url = URL.createObjectURL(f);
      this.editImages.push({ url, isNew: true });
    }
    this.isDirty = true;
    input.value = '';
  }

  removeEditImage(idx: number): void {
    const it = this.editImages[idx];
    if (it.isNew) URL.revokeObjectURL(it.url);
    this.editImages.splice(idx, 1);
    this.isDirty = true;
  }

  onUploadVariantImages(ev: Event, v: VariantEditVM): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    for (const f of files) {
      const url = URL.createObjectURL(f);
      v.images.push({ url });
    }
    this.isDirty = true;
    input.value = '';
  }

  removeVariantImage(v: VariantEditVM, idx: number): void {
    v.images.splice(idx, 1);
    this.isDirty = true;
  }

  toggleCommentHidden(commentId: string): void {
    const d = this.detailSubject$.value;
    if (!d) return;
    const c = d.comments.find(x => x.id === commentId);
    if (c) c.hidden = !c.hidden;
    this.isDirty = true;
  }

  deleteComment(commentId: string): void {
     this.deleteItemId = commentId;
     this.deleteItemType = 'comment';
     this.deleteModalTitle = 'Xác nhận xóa đánh giá';
     this.deleteModalMessage = 'Bạn có chắc chắn muốn xóa đánh giá này không?';
     this.deleteModalOpen = true;
  }

  saveEdit(): void {
    this.saveModalOpen = true;
  }

  async executeSave(): Promise<void> {
    if (!this.editForm) return;
    this.saveModalOpen = false;
    this.saving = true;

    try {
      for (const img of this.editImages) {
        if (img.isNew) {
           img.url = await this.uploadBlob(img.url);
           img.isNew = false;
        }
      }

      // NEW: Upload images for each variant
      for (const v of this.editVariants) {
        for (const vImg of v.images) {
          if (vImg.url.startsWith('blob:')) {
            vImg.url = await this.uploadBlob(vImg.url);
          }
        }
      }

      const payload = {
        editForm: {
          ...this.editForm,
          product_main_image: this.editImages[0]?.url || ''
        },
        editVariants: this.editVariants,
      };

      if (this.isCreateMode) {
        await lastValueFrom(this.http.post(`${environment.backend_url}/admin/products`, payload, { withCredentials: true }));
      } else {
        await lastValueFrom(
          this.http.put(
            `${environment.backend_url}/admin/products/${this.selectedProductId}`,
            payload,
            { withCredentials: true }
          ),
        );
      }

      this.isDirty = false;
      this.saving = false;
      this.loadData();
      this.backToList();
    } catch (e: any) {
      console.error('Product save error:', e);
      const msg = e?.error?.message || e?.message || 'Lỗi không xác định';
      alert('Lỗi khi lưu sản phẩm: ' + msg);
      this.saving = false;
    }
  }

  private async uploadBlob(blobUrl: string): Promise<string> {
    const blob = await fetch(blobUrl).then((r) => r.blob());
    const fd = new FormData();
    fd.append('image', blob, 'image.jpg');
    const res = await lastValueFrom(this.http.post<any>('http://localhost:3000/api/upload', fd));
    return res?.data?.imageUrl || blobUrl;
  }

  softDelete(productId: string): void {
    this.deleteItemId = productId;
    this.deleteItemType = 'product';
    this.deleteModalTitle = 'Xác nhận xóa';
    this.deleteModalMessage = 'Bạn có chắc chắn muốn xóa sản phẩm này?';
    this.deleteModalOpen = true;
  }

  async onConfirmDelete(): Promise<void> {
    if (!this.deleteItemId) return;
    try {
      if (this.deleteItemType === 'product') {
        await lastValueFrom(
          this.http.delete(`http://localhost:3000/api/admin/products/${this.deleteItemId}`)
        );
      } else {
        // Mock delete comment or real API
        const d = this.detailSubject$.value;
        if (d) d.comments = d.comments.filter(x => x.id !== this.deleteItemId);
        this.isDirty = true;
      }
      this.loadData();
    } catch (e) {
      console.error(e);
    }
    this.deleteModalOpen = false;
  }

  onCancelDelete(): void {
    this.deleteModalOpen = false;
  }

  stopEvent(ev: Event): void {
    ev.stopPropagation();
  }

  private clearEditState(): void {
    this.editForm = null;
    this.isDirty = false;
    this.saving = false;
    this.isCreateMode = false;
    this.editVariants = [];
    this.editImages = [];
    this.detailSubject$.next(null);
  }

  exportCsv(): void {
    const header = ['ID', 'Name', 'Brand', 'Price Min', 'Stock'];
    const rows = this.exportRows.map(r => [r.id, r.name, r.brand, r.priceMin, r.inventoryTotal]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products.csv");
    link.click();
  }

  headerStatusLabel(inventoryTotal: number): string {
    if (inventoryTotal <= 0) return 'Hết hàng';
    if (inventoryTotal <= 10) return 'Sắp hết';
    return 'Còn hàng';
  }

  headerStatusClass(inventoryTotal: number): string {
    if (inventoryTotal <= 0) return 'hb-pill-danger';
    if (inventoryTotal <= 10) return 'hb-pill-warning';
    return 'hb-pill-success';
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function compareByKey(a: any, b: any, key: string, dir: SortDir): number {
  const factor = dir === 'asc' ? 1 : -1;
  const av = a[key];
  const bv = b[key];
  if (av < bv) return -1 * factor;
  if (av > bv) return 1 * factor;
  return 0;
}

function inferRoomFromProduct(p: any): string {
  const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
  if (tags.includes('living')) return 'Phòng khách';
  if (tags.includes('bed')) return 'Phòng ngủ';
  if (tags.includes('dining')) return 'Phòng ăn';
  return 'Khác';
}
