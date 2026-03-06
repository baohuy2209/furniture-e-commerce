import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, forkJoin, map, takeUntil } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type ProductId = string;
type VariantId = string;

interface Product {
  product_id: ProductId;
  product_name: string;
  brand_name: string;
  description: string;
  discount_percent: number;
  is_assembly: boolean;
  warranty: number;
  tags: string[];
  important_funtions: string[];
  product_component: Record<string, any>;
  image_url: string[];
}

interface ProductVariant {
  product_id: ProductId;
  product_varant_id: VariantId;
  price: number;
  weight: number;
  num_inventory: number;
  num_selled: number;
  designed_by: string;
  rating: number;
  expected_delivery: string;
  component_variants: Record<string, any>;
  is_default: boolean;
  measurement: Record<string, any>;
}

interface ProductImage {
  product_varant_id: VariantId;
  url: string;
  is_main: boolean;
  position: number;
}

interface Room {
  name: string;
}

interface ProductComment {
  id: string;
  productId: ProductId;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  hidden?: boolean; // for edit moderation
}

interface ProductRowVM {
  id: ProductId; // numeric-like string
  name: string;
  brand: string;
  discountPercent: number;
  warranty: number;
  tags: string[];
  isAssembly: boolean;

  priceMin: number | null;
  priceMax: number | null;
  inventoryTotal: number;
  soldTotal: number;
  ratingAvg: number | null;

  roomLabel: string;
  imageCover: string | null;
  stt: number;
}

interface ListQuery {
  q: string;
  room: string;
  stock: 'all' | 'in' | 'out' | 'low';
  lowStockThreshold: number;

  minPrice: number | null;
  maxPrice: number | null;

  sortKey: keyof ProductRowVM;
  sortDir: SortDir;

  page: number;
  pageSize: number;
}

type PageMode = 'list' | 'detail' | 'edit';

interface EditForm {
  product_name: string;
  brand_name: string;
  discount_percent: number;
  warranty: number;
  is_assembly: boolean;
  tagsText: string;
  description: string;
}

interface VariantEditVM {
  product_varant_id: VariantId;
  is_default: boolean;
  price: number;
  num_inventory: number;
  num_selled: number;
  rating: number;
  expected_delivery: string;
}

@Component({
  selector: 'app-management-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule, NgIf, NgFor, DatePipe, ConfirmModal],
  templateUrl: './management-products.html',
  styleUrls: ['./management-products.css'],
})
export class ManagementProducts implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Seed data stores
  private products$ = new BehaviorSubject<Product[]>([]);
  private variants$ = new BehaviorSubject<ProductVariant[]>([]);
  private images$ = new BehaviorSubject<ProductImage[]>([]);
  private rooms$ = new BehaviorSubject<Room[]>([]);

  // UI state synced with route
  mode: PageMode = 'list';
  selectedProductId: ProductId | null = null;
  detailTab: 'overview' | 'variants' | 'comments' = 'overview';

  // Edit state
  editForm: EditForm | null = null;
  private originalProductSnapshot: Product | null = null;
  isDirty = false;
  saving = false;
  localSearchTerm = '';

  // for create flow
  isCreateMode = false;

  // cached rows for CSV export (filtered + sorted, not paged)
  exportRows: ProductRowVM[] = [];

  // editable variants draft in edit mode
  editVariants: VariantEditVM[] = [];

  // editable images draft (object URL for mock upload)
  editImages: { url: string; isNew?: boolean }[] = [];

  // comments store (mock but editable)
  private commentsByProduct = new Map<ProductId, ProductComment[]>();

  // Deletion Modal state
  deleteModalOpen = false;
  deleteItemId: string | null = null;
  deleteItemType: 'product' | 'comment' = 'product';
  deleteModalTitle = '';
  deleteModalMessage = '';

  saveModalOpen = false;

  query$ = new BehaviorSubject<ListQuery>({
    q: '',
    room: '',
    stock: 'all',
    lowStockThreshold: 5,
    minPrice: null,
    maxPrice: null,

    sortKey: 'id',
    sortDir: 'asc',

    page: 1,
    pageSize: 10,
  });

  // Full rows (unpaged), used to build list vm and export cache
  private rowsAll$ = combineLatest([
    this.products$,
    this.variants$,
    this.images$,
    this.rooms$,
  ]).pipe(
    map(([products, variants, images, rooms]) => {
      return products.map((p) => {
        const pv = variants.filter((v) => v.product_id === p.product_id);

        const priceMin = pv.length ? Math.min(...pv.map((x) => x.price)) : null;
        const priceMax = pv.length ? Math.max(...pv.map((x) => x.price)) : null;

        const inventoryTotal = pv.reduce((s, x) => s + (x.num_inventory ?? 0), 0);
        const soldTotal = pv.reduce((s, x) => s + (x.num_selled ?? 0), 0);

        const ratingAvg = pv.length
          ? round2(pv.reduce((s, x) => s + (x.rating ?? 0), 0) / pv.length)
          : null;

        const roomLabel = inferRoomFromProduct(p, rooms);
        const coverUrl = inferCoverImage(p, pv, images);

        const row: ProductRowVM = {
          id: p.product_id,
          name: p.product_name,
          brand: p.brand_name,
          discountPercent: p.discount_percent,
          warranty: p.warranty,
          tags: Array.isArray(p.tags) ? p.tags : [],
          isAssembly: !!p.is_assembly,
          priceMin,
          priceMax,
          inventoryTotal,
          soldTotal,
          ratingAvg,
          roomLabel,
          imageCover: coverUrl,
          stt: 0,
        };
        return row;
      });
    }),
  );

  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      // FILTER
      let filtered = rowsAll.slice();

      const q = (query.q || '').trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((r) => {
          const hay = `${r.id} ${r.name} ${r.brand} ${r.tags.join(' ')}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (query.room) filtered = filtered.filter((r) => r.roomLabel === query.room);

      if (query.minPrice != null)
        filtered = filtered.filter((r) => (r.priceMin ?? 0) >= query.minPrice!);
      if (query.maxPrice != null)
        filtered = filtered.filter((r) => (r.priceMax ?? 0) <= query.maxPrice!);

      if (query.stock !== 'all') {
        if (query.stock === 'in') filtered = filtered.filter((r) => r.inventoryTotal > 0);
        if (query.stock === 'out') filtered = filtered.filter((r) => r.inventoryTotal <= 0);
        if (query.stock === 'low') {
          filtered = filtered.filter(
            (r) => r.inventoryTotal > 0 && r.inventoryTotal <= query.lowStockThreshold,
          );
        }
      }

      // SORT (fix numeric id issue)
      filtered.sort((a, b) => compareByKey(a, b, query.sortKey, query.sortDir));

      // cache for export (avoid async pipe in click)
      this.exportRows = filtered;

      const roomOptions = Array.from(new Set(rowsAll.map((x) => x.roomLabel))).sort((a, b) =>
        a.localeCompare(b),
      );

      // PAGINATION
      const total = filtered.length;
      const pageSize = Math.max(1, query.pageSize);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = clamp(query.page, 1, totalPages);

       const start = (page - 1) * pageSize;
       const rows: ProductRowVM[] = filtered.slice(start, start + pageSize).map((r, i) => ({
         ...r,
         stt: start + i + 1,
       }));

      const summary = {
        totalProducts: rowsAll.length,
        lowStockProducts: rowsAll.filter((r) => r.inventoryTotal <= query.lowStockThreshold).length,
        totalSold: rowsAll.reduce((s, r) => s + r.soldTotal, 0)
      };

      return {
        rows,
        total,
        page,
        pageSize,
        totalPages,
        query,
        roomOptions,
        summary,
      };
    }),
  );

  detail$ = combineLatest([this.products$, this.variants$, this.images$]).pipe(
    map(([products, variants, images]) => {
      if (!this.selectedProductId) return null;
      if (this.selectedProductId === 'new') return null;

      const p = products.find((x) => x.product_id === this.selectedProductId) ?? null;
      if (!p) return null;

      const pv = variants.filter((v) => v.product_id === p.product_id);
      const pvIds = new Set(pv.map((x) => x.product_varant_id));

      const imgs = images
        .filter((im) => pvIds.has(im.product_varant_id))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      const comments = this.getComments(p.product_id);

      return {
        product: p,
        variants: pv,
        images: imgs,
        comments,
        inventoryTotal: pv.reduce((s, x) => s + (x.num_inventory ?? 0), 0),
        priceMin: pv.length ? Math.min(...pv.map((x) => x.price)) : null,
        priceMax: pv.length ? Math.max(...pv.map((x) => x.price)) : null,
      };
    }),
  );

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSeedData();
    this.bindRouteState();
  }

  ngOnDestroy(): void {
    // revoke any objectURLs created during upload mock
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

  // ================== ROUTE SYNC ==================
  private bindRouteState(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const id = qp.get('id');
      const mode = (qp.get('mode') as PageMode) || 'list';

      const incomingId = id ? String(id) : null;
      const incomingMode: PageMode = mode || 'list';

      const changed = incomingId !== this.selectedProductId || incomingMode !== this.mode;

      if (changed && this.isDirty) {
        const ok = confirm('Bạn có thay đổi chưa lưu. Thoát sẽ mất dữ liệu. Bạn muốn thoát?');
        if (!ok) {
          this.syncRoute(this.selectedProductId, this.mode, false);
          return;
        }
        this.clearEditState();
      }

      this.selectedProductId = incomingId;
      this.mode = incomingId ? incomingMode : 'list';

      if (this.mode === 'edit') {
        this.initEditForm(incomingId);
      } else {
        this.clearEditState();
      }

      if (this.mode === 'detail') this.detailTab = this.detailTab || 'overview';
      if (this.mode === 'list') this.detailTab = 'overview';
    });
  }

  private syncRoute(id: string | null, mode: PageMode, push: boolean): void {
    const queryParams: any = {};
    if (id) queryParams.id = id;
    else queryParams.id = null;

    if (id && mode !== 'list') queryParams.mode = mode;
    else queryParams.mode = null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: !push,
    });
  }

  // ================== DATA LOAD ==================
  private loadSeedData(): void {
    forkJoin({
      products: this.http.get<Product[]>('assets/data/product.json'),
      variants: this.http.get<ProductVariant[]>('assets/data/product_variants.json'),
      images: this.http.get<ProductImage[]>('assets/data/product_image.json'),
      rooms: this.http.get<Room[]>('assets/home/room.json'),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.products$.next(Array.isArray(res.products) ? res.products : []);
          this.variants$.next(Array.isArray(res.variants) ? res.variants : []);
          this.images$.next(Array.isArray(res.images) ? res.images : []);
          this.rooms$.next(Array.isArray(res.rooms) ? res.rooms : []);
        },
        error: () => {
          this.products$.next([]);
          this.variants$.next([]);
          this.images$.next([]);
          this.rooms$.next([{ name: 'Phòng khách' }, { name: 'Phòng ngủ' }, { name: 'Khác' }]);
        },
      });
  }

  // ================== LIST BEHAVIOR ==================
  patchQuery(patch: Partial<ListQuery>): void {
    const prev = this.query$.value;
    const next = { ...prev, ...patch };

    const changedFilterOrSort =
      patch.q !== undefined ||
      patch.room !== undefined ||
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
    const keepSort = { sortKey: this.query$.value.sortKey, sortDir: this.query$.value.sortDir };
    this.query$.next({
      q: '',
      room: '',
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
    if (q.sortKey !== key) return '▲▼'; // both when not active
    return q.sortDir === 'asc' ? '▲' : '▼';
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

  // ================== DETAIL / EDIT NAV ==================
  backToList(): void {
    if (this.isDirty) {
      const ok = confirm('Bạn có thay đổi chưa lưu. Thoát sẽ mất dữ liệu. Bạn muốn thoát?');
      if (!ok) return;
    }
    this.clearEditState();
    this.syncRoute(null, 'list', true);
  }

  goEdit(): void {
    if (!this.selectedProductId) return;
    this.syncRoute(this.selectedProductId, 'edit', true);
  }

  cancelEdit(): void {
    if (this.isDirty) {
      const ok = confirm('Hủy chỉnh sửa sẽ mất thay đổi. Bạn chắc chắn?');
      if (!ok) return;
    }
    this.clearEditState();
    if (!this.selectedProductId) this.syncRoute(null, 'list', true);
    else if (this.selectedProductId === 'new') this.syncRoute(null, 'list', true);
    else this.syncRoute(this.selectedProductId, 'detail', true);
  }

  // ================== EDIT FLOW ==================
  private initEditForm(productId: string | null): void {
    // reset drafts
    this.editVariants = [];
    this.editImages = [];
    this.isCreateMode = productId === 'new';

    if (!productId) return;

    if (productId === 'new') {
      // create empty form
      this.originalProductSnapshot = null;
      this.editForm = {
        product_name: '',
        brand_name: '',
        discount_percent: 0,
        warranty: 12,
        is_assembly: false,
        tagsText: '',
        description: '',
      };
      // create 1 default variant draft
      this.editVariants = [
        {
          product_varant_id: 'new-v1',
          is_default: true,
          price: 0,
          num_inventory: 0,
          num_selled: 0,
          rating: 0,
          expected_delivery: '3-5 days',
        },
      ];
      this.isDirty = false;
      this.detailTab = 'overview';
      return;
    }

    const p = this.products$.value.find((x) => x.product_id === productId) ?? null;
    if (!p) return;

    this.originalProductSnapshot = deepClone(p);
    this.editForm = {
      product_name: p.product_name ?? '',
      brand_name: p.brand_name ?? '',
      discount_percent: Number(p.discount_percent ?? 0),
      warranty: Number(p.warranty ?? 0),
      is_assembly: !!p.is_assembly,
      tagsText: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      description: p.description ?? '',
    };

    // variants draft
    const pv = this.variants$.value.filter((v) => v.product_id === productId);
    this.editVariants = pv.map((v) => ({
      product_varant_id: v.product_varant_id,
      is_default: !!v.is_default,
      price: Number(v.price ?? 0),
      num_inventory: Number(v.num_inventory ?? 0),
      num_selled: Number(v.num_selled ?? 0),
      rating: Number(v.rating ?? 0),
      expected_delivery: v.expected_delivery ?? '',
    }));

    // images draft (from product.image_url + variant images)
    const imgsFromProduct = Array.isArray(p.image_url) ? p.image_url : [];
    this.editImages = imgsFromProduct.map((url) => ({ url }));

    this.isDirty = false;
    this.detailTab = this.detailTab || 'overview';
  }

  onEditChange(): void {
    if (!this.editForm) return;
    this.isDirty = true;
  }

  onVariantChange(): void {
    this.isDirty = true;
  }

  onUploadImages(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    for (const f of files) {
      const url = URL.createObjectURL(f);
      this.editImages.push({ url, isNew: true });
    }

    this.isDirty = true;
    input.value = '';
  }

  removeEditImage(idx: number): void {
    const it = this.editImages[idx];
    if (!it) return;
    if (it.isNew) URL.revokeObjectURL(it.url);
    this.editImages.splice(idx, 1);
    this.isDirty = true;
  }

  saveEdit(): void {
    if (!this.editForm) return;
    this.saveModalOpen = true;
  }

  executeSave(): void {
    if (!this.editForm) return;
    this.saveModalOpen = false;
    this.saving = true;

    if (this.isCreateMode) {
      const newId = this.nextNumericProductId();

      const newProduct: Product = {
        product_id: String(newId),
        product_name: this.editForm.product_name.trim() || `New product ${newId}`,
        brand_name: this.editForm.brand_name.trim() || 'Unknown',
        description: this.editForm.description || '',
        discount_percent: clampNumber(this.editForm.discount_percent, 0, 100),
        is_assembly: !!this.editForm.is_assembly,
        warranty: Math.max(0, Number(this.editForm.warranty || 0)),
        tags: parseTags(this.editForm.tagsText),
        important_funtions: [],
        product_component: {},
        image_url: this.editImages.map((x) => x.url),
      };

      // push product
      const products = this.products$.value.slice();
      products.push(newProduct);
      this.products$.next(products);

      // create variants
      const variants = this.variants$.value.slice();
      const baseVariantId = `${newId}-v1`;

      const v0 = this.editVariants[0] ?? {
        product_varant_id: 'new-v1',
        is_default: true,
        price: 0,
        num_inventory: 0,
        num_selled: 0,
        rating: 0,
        expected_delivery: '3-5 days',
      };

      variants.push({
        product_id: String(newId),
        product_varant_id: baseVariantId,
        price: Number(v0.price ?? 0),
        weight: 0,
        num_inventory: Number(v0.num_inventory ?? 0),
        num_selled: Number(v0.num_selled ?? 0),
        designed_by: '',
        rating: Number(v0.rating ?? 0),
        expected_delivery: v0.expected_delivery ?? '',
        component_variants: {},
        is_default: true,
        measurement: {},
      });
      this.variants$.next(variants);

      // images: attach to created variant as mock
      const imgs = this.images$.value.slice();
      let pos = 1;
      for (const im of this.editImages) {
        imgs.push({
          product_varant_id: baseVariantId,
          url: im.url,
          is_main: pos === 1,
          position: pos++,
        });
      }
      this.images$.next(imgs);

      this.saving = false;
      this.clearEditState();
      this.syncRoute(String(newId), 'detail', true);
      return;
    }

    // update existing
    if (!this.selectedProductId || this.selectedProductId === 'new') return;

    const updated: Partial<Product> = {
      product_name: this.editForm.product_name.trim(),
      brand_name: this.editForm.brand_name.trim(),
      discount_percent: clampNumber(this.editForm.discount_percent, 0, 100),
      warranty: Math.max(0, Number(this.editForm.warranty || 0)),
      is_assembly: !!this.editForm.is_assembly,
      tags: parseTags(this.editForm.tagsText),
      description: this.editForm.description,
      image_url: this.editImages.map((x) => x.url),
    };

    const products = this.products$.value.slice();
    const idx = products.findIndex((x) => x.product_id === this.selectedProductId);
    if (idx >= 0) {
      products[idx] = { ...products[idx], ...updated };
      this.products$.next(products);
    }

    // update variants price/inventory
    const variants = this.variants$.value.slice();
    const vSet = new Map(this.editVariants.map((v) => [v.product_varant_id, v]));
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (v.product_id !== this.selectedProductId) continue;
      const draft = vSet.get(v.product_varant_id);
      if (!draft) continue;
      variants[i] = {
        ...v,
        price: Number(draft.price ?? v.price),
        num_inventory: Number(draft.num_inventory ?? v.num_inventory),
        expected_delivery: draft.expected_delivery ?? v.expected_delivery,
        is_default: !!draft.is_default,
      };
    }
    this.variants$.next(variants);

    // update images store for default variant (mock)
    const pv = variants.filter((x) => x.product_id === this.selectedProductId);
    const def = pv.find((x) => x.is_default) ?? pv[0];
    if (def) {
      const imgs = this.images$.value
        .slice()
        .filter((im) => im.product_varant_id !== def.product_varant_id);
      let pos = 1;
      for (const im of this.editImages) {
        imgs.push({
          product_varant_id: def.product_varant_id,
          url: im.url,
          is_main: pos === 1,
          position: pos++,
        });
      }
      this.images$.next(imgs);
    }

    this.isDirty = false;
    this.saving = false;

    this.syncRoute(this.selectedProductId, 'detail', true);
  }

  private clearEditState(): void {
    this.editForm = null;
    this.originalProductSnapshot = null;
    this.isDirty = false;
    this.saving = false;
    this.isCreateMode = false;
    this.editVariants = [];
    // do not revoke old images URLs (could be used in list), only revoke new ones when removed
    this.editImages = [];
  }

  // ================== CSV EXPORT ==================
  exportCsv(rows: ProductRowVM[]): void {
    const header = [
      'product_id',
      'product_name',
      'brand_name',
      'room',
      'price_min',
      'price_max',
      'inventory_total',
      'sold_total',
      'rating_avg',
      'discount_percent',
      'warranty_months',
      'tags',
    ];

    const lines = rows.map((r) => [
      csvCell(r.id),
      csvCell(r.name),
      csvCell(r.brand),
      csvCell(r.roomLabel),
      csvCell(r.priceMin ?? ''),
      csvCell(r.priceMax ?? ''),
      csvCell(r.inventoryTotal),
      csvCell(r.soldTotal),
      csvCell(r.ratingAvg ?? ''),
      csvCell(r.discountPercent),
      csvCell(r.warranty),
      csvCell((r.tags || []).join('|')),
    ]);

    const csv = [header.join(','), ...lines.map((x) => x.join(','))].join('\n');
    downloadText(
      csv,
      `products_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;',
    );
  }

  // ================== DELETE (soft mock) ==================
  softDelete(productId: string): void {
    this.deleteItemId = productId;
    this.deleteItemType = 'product';
    this.deleteModalTitle = 'Xác nhận xóa sản phẩm';
    this.deleteModalMessage = 'Bạn có chắc chắn muốn xóa sản phẩm này? Dữ liệu sẽ bị gỡ khỏi danh sách quản lý.';
    this.deleteModalOpen = true;
  }

  onConfirmDelete(): void {
    if (!this.deleteItemId) return;

    if (this.deleteItemType === 'product') {
      const next = this.products$.value.filter((p) => p.product_id !== this.deleteItemId);
      this.products$.next(next);
      if (this.selectedProductId === this.deleteItemId) this.backToList();
    } else {
      // comment
      if (this.selectedProductId && this.selectedProductId !== 'new') {
        const list = this.getComments(this.selectedProductId).filter((x) => x.id !== this.deleteItemId);
        this.commentsByProduct.set(this.selectedProductId, list);
        this.isDirty = true;
      }
    }

    this.deleteModalOpen = false;
    this.deleteItemId = null;
  }

  onCancelDelete(): void {
    this.deleteModalOpen = false;
    this.deleteItemId = null;
  }

  // ================== COMMENTS MODERATION (mock) ==================
  private getComments(productId: ProductId): ProductComment[] {
    const existing = this.commentsByProduct.get(productId);
    if (existing) return existing;

    const seed = buildMockComments(productId);
    this.commentsByProduct.set(productId, seed);
    return seed;
  }

  toggleCommentHidden(cmtId: string): void {
    if (!this.selectedProductId || this.selectedProductId === 'new') return;
    const list = this.getComments(this.selectedProductId);
    const idx = list.findIndex((x) => x.id === cmtId);
    if (idx < 0) return;
    list[idx] = { ...list[idx], hidden: !list[idx].hidden };
    this.commentsByProduct.set(this.selectedProductId, list.slice());
    this.isDirty = true;
  }

  deleteComment(cmtId: string): void {
    if (!this.selectedProductId || this.selectedProductId === 'new') return;
    this.deleteItemId = cmtId;
    this.deleteItemType = 'comment';
    this.deleteModalTitle = 'Xác nhận xóa đánh giá';
    this.deleteModalMessage = 'Bạn có chắc chắn muốn xóa đánh giá này khỏi hệ thống?';
    this.deleteModalOpen = true;
  }

  // ================== HELPERS ==================
  private nextNumericProductId(): number {
    const ids = this.products$.value
      .map((p) => toNumberSafe(p.product_id))
      .filter((n) => Number.isFinite(n)) as number[];
    const maxId = ids.length ? Math.max(...ids) : 0;
    return maxId + 1;
  }

  stopEvent(ev: Event): void {
    ev.stopPropagation();
  }
}

/* ================= Helpers (pure) ================= */

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clampNumber(v: any, min: number, max: number): number {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return clamp(n, min, max);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toNumberSafe(v: any): number {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
}

function compareByKey(a: ProductRowVM, b: ProductRowVM, key: any, dir: SortDir): number {
  const factor = dir === 'asc' ? 1 : -1;

  // FIX numeric sort for product id
  if (key === 'id') {
    const av = toNumberSafe(a.id);
    const bv = toNumberSafe(b.id);
    if (Number.isFinite(av) && Number.isFinite(bv)) return (av - bv) * factor;
    return String(a.id).localeCompare(String(b.id)) * factor;
  }

  const av = (a as any)[key];
  const bv = (b as any)[key];

  if (av == null && bv == null) return 0;
  if (av == null) return 1 * factor;
  if (bv == null) return -1 * factor;

  if (typeof av === 'string' || typeof bv === 'string') {
    return String(av).localeCompare(String(bv)) * factor;
  }

  return (Number(av) - Number(bv)) * factor;
}

function inferRoomFromProduct(p: Product, rooms: Room[]): string {
  const tagText = (p.tags || []).join(' ').toLowerCase();
  const imgText = (p.image_url || []).join(' ').toLowerCase();

  for (const r of rooms || []) {
    const k = (r.name || '').trim();
    if (!k) continue;
    const kl = k.toLowerCase();
    if (tagText.includes(kl) || imgText.includes(kl)) return r.name;
  }

  if (tagText.includes('living room') || imgText.includes('living_room')) return 'Phòng khách';
  if (tagText.includes('bedroom') || imgText.includes('bedroom')) return 'Phòng ngủ';
  if (tagText.includes('dining') || imgText.includes('dining_room')) return 'Phòng ăn';
  if (tagText.includes('office') || imgText.includes('office')) return 'Phòng làm việc';

  return 'Khác';
}

function inferCoverImage(p: Product, pv: ProductVariant[], images: ProductImage[]): string | null {
  const defaultVariant = pv.find((x) => x.is_default) ?? pv[0];
  if (defaultVariant) {
    const main = images.find(
      (im) => im.product_varant_id === defaultVariant.product_varant_id && im.is_main,
    );
    if (main?.url) return main.url;
  }
  if (Array.isArray(p.image_url) && p.image_url.length) return p.image_url[0] ?? null;
  return null;
}

function parseTags(tagsText: string): string[] {
  return (tagsText || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function csvCell(v: any): string {
  const s = String(v ?? '');
  const escaped = s.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildMockComments(productId: ProductId): ProductComment[] {
  const base: Omit<ProductComment, 'productId'>[] = [
    {
      id: 'cmt-001',
      userName: 'Mai Anh',
      rating: 5,
      content: 'Chất lượng tốt, form chắc. Giao nhanh hơn dự kiến.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-002',
      userName: 'Nguyễn Khánh Xuân',
      rating: 4,
      content: 'Màu đúng như hình. Lắp ráp hơi mất thời gian nhưng ổn.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-003',
      userName: 'Võ Hồng Phúc',
      rating: 5,
      content: 'Ngồi êm, vải đẹp. Sẽ mua thêm cho phòng ngủ.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-004',
      userName: 'Nguyễn Minh Quân',
      rating: 3,
      content: 'Đóng gói tốt. Tuy nhiên giao chậm 1 ngày so với hẹn.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-005',
      userName: 'Nguyễn Quang Phúc',
      rating: 4,
      content: 'Giá hợp lý, nhìn sang. Hy vọng dùng lâu bền.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      hidden: false,
    },
  ];
  return base.map((x) => ({ ...x, productId }));
}
