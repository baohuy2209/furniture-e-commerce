import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, forkJoin, map, takeUntil, finalize } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import {
  IListProducts,
  Iproduct,
  Iproduct_variants,
  Iproduct_variants_image,
} from '../../../../interface';
import { Product as ProductService } from '../../../services/product';
import { ProductVariantService } from '../../../services/product-variant-service';
import { ProductVariantImageService } from '../../../services/product-variant-image-service';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';
type ProductId = string;
type VariantId = string;
type PageMode = 'list' | 'detail' | 'edit';

/**
 * Gộp IListProducts (từ getAllProducts) và Iproduct (từ getProductDetail).
 * - Load danh sách: có main_image, price, rating (số), num_selled, tags (string)
 * - Load detail:    có image_url[], product_component, brand, warranty, ...
 */
type ProductData = IListProducts & Partial<Iproduct>;

interface ProductComment {
  id: string;
  productId: ProductId;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  hidden?: boolean;
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

interface KVEntry {
  key: string;
  value: string;
  image_url?: string;
}

interface VariantEditVM {
  product_varant_id: VariantId;
  is_default: boolean;
  price: number;
  num_inventory: number;
  num_selled: number;
  rating: number;
  expected_delivery: string;
  weight: number;
  designed_by: string;
  componentEntries: KVEntry[];
  measurementEntries: KVEntry[];
  images: { url: string; isNew?: boolean }[];
  expanded: boolean;
}

interface ProductDetailVM {
  product: ProductData;
  variants: Iproduct_variants[];
  images: Iproduct_variants_image[];
  comments: ProductComment[];
  inventoryTotal: number;
  priceMin: number | null;
  priceMax: number | null;
  soldTotal: number;
  ratingAvg: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-management-products',
  standalone: true,
  imports: [ConfirmModal, CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './management-products.html',
  styleUrls: ['./management-products.css'],
})
export class ManagementProducts implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── State streams ────────────────────────────────────────────────────────
  private products$ = new BehaviorSubject<ProductData[]>([]);
  private variants$ = new BehaviorSubject<Iproduct_variants[]>([]);
  private images$ = new BehaviorSubject<Iproduct_variants_image[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  mode: PageMode = 'list';
  selectedProductId: ProductId | null = null;
  detailTab: 'overview' | 'variants' | 'comments' = 'overview';

  editForm: EditForm | null = null;
  private originalProductSnapshot: ProductData | null = null;
  private pendingDiscardAction: (() => void) | null = null;

  isDirty = false;
  saving = false;
  loading = false;
  localSearchTerm = '';
  isCreateMode = false;

  exportRows: ProductRowVM[] = [];
  editVariants: VariantEditVM[] = [];
  editImages: { url: string; isNew?: boolean }[] = [];
  expandedVariants = new Set<string>();

  private commentsByProduct = new Map<ProductId, ProductComment[]>();

  // ── Modal state ──────────────────────────────────────────────────────────
  deleteModalOpen = false;
  deleteItemId: string | null = null;
  deleteItemType: 'product' | 'comment' = 'product';
  deleteModalTitle = '';
  deleteModalMessage = '';
  saveModalOpen = false;
  discardModalOpen = false;

  // ── Query stream ─────────────────────────────────────────────────────────
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

  // ── Derived: tất cả rows (chưa filter) ──────────────────────────────────
  private rowsAll$ = combineLatest([this.products$, this.variants$, this.images$]).pipe(
    map(([products, variants, images]) =>
      products.map((p) => {
        const pv = variants.filter((v) => v.product === p._id);

        // price: IListProducts có sẵn 1 giá, variant có thể nhiều giá
        const listPrice = typeof p.price === 'number' ? p.price : null;
        const priceMin = listPrice ?? (pv.length ? Math.min(...pv.map((x) => x.price)) : null);
        const priceMax = listPrice ?? (pv.length ? Math.max(...pv.map((x) => x.price)) : null);

        const inventoryTotal = pv.reduce((s, x) => s + (x.num_inventory ?? 0), 0);

        // num_selled: ưu tiên field từ IListProducts
        const soldTotal =
          typeof p.num_selled === 'number'
            ? p.num_selled
            : pv.reduce((s, x) => s + (x.num_selled ?? 0), 0);

        // rating: IListProducts là số thẳng, Iproduct_variants là { average, count }
        const ratingAvg =
          typeof p.rating === 'number'
            ? p.rating
            : pv.length
              ? round2(pv.reduce((s, x) => s + (x.rating?.average ?? 0), 0) / pv.length)
              : null;

        return {
          id: p._id,
          name: p.product_name,
          brand: p.brand ?? '',
          discountPercent: p.discount_percent ?? 0,
          warranty: p.warranty ?? 0,
          tags: normalizeTags(p.tags),
          isAssembly: !!p.is_assembly,
          priceMin,
          priceMax,
          inventoryTotal,
          soldTotal,
          ratingAvg,
          roomLabel: inferRoomFromProduct(p),
          // Ảnh bìa: main_image → variant default is_main → image_url[0]
          imageCover: resolveMainImage(p, pv, images),
          stt: 0,
        } as ProductRowVM;
      }),
    ),
  );

  // ── Derived: filtered + paginated VM ────────────────────────────────────
  vm$ = combineLatest([this.rowsAll$, this.query$]).pipe(
    map(([rowsAll, query]) => {
      let filtered = rowsAll.slice();

      const q = (query.q || '').trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((r) =>
          `${r.id} ${r.name} ${r.brand} ${r.tags.join(' ')}`.toLowerCase().includes(q),
        );
      }

      if (query.room) filtered = filtered.filter((r) => r.roomLabel === query.room);
      if (query.brand) filtered = filtered.filter((r) => r.brand === query.brand);
      if (query.minPrice != null)
        filtered = filtered.filter((r) => (r.priceMin ?? 0) >= query.minPrice!);
      if (query.maxPrice != null)
        filtered = filtered.filter((r) => (r.priceMax ?? 0) <= query.maxPrice!);
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
        .filter(Boolean)
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
        totalSold: rowsAll.reduce((s, r) => s + r.soldTotal, 0),
      };

      return { rows, total, page, pageSize, totalPages, query, roomOptions, brandOptions, summary };
    }),
  );

  // ── Derived: detail VM ───────────────────────────────────────────────────
  detail$ = combineLatest([this.products$, this.variants$, this.images$]).pipe(
    map(([products, variants, images]): ProductDetailVM | null => {
      if (!this.selectedProductId || this.selectedProductId === 'new') return null;

      const p = products.find((x) => x._id === this.selectedProductId) ?? null;
      if (!p) return null;

      const pv = variants.filter((v) => v.product === p._id);
      const pvIds = new Set(pv.map((x) => x._id));
      const imgs = images
        .filter((im) => pvIds.has(im.product_varant))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      const comments = this.getComments(p._id);
      const inventoryTotal = pv.reduce((s, x) => s + (x.num_inventory ?? 0), 0);
      const soldTotal =
        typeof p.num_selled === 'number'
          ? p.num_selled
          : pv.reduce((s, x) => s + (x.num_selled ?? 0), 0);
      const ratingAvg =
        typeof p.rating === 'number'
          ? p.rating
          : pv.length
            ? round2(pv.reduce((s, x) => s + (x.rating?.average ?? 0), 0) / pv.length)
            : null;

      return {
        product: p,
        variants: pv,
        images: imgs,
        comments,
        inventoryTotal,
        priceMin:
          typeof p.price === 'number'
            ? p.price
            : pv.length
              ? Math.min(...pv.map((x) => x.price))
              : null,
        priceMax:
          typeof p.price === 'number'
            ? p.price
            : pv.length
              ? Math.max(...pv.map((x) => x.price))
              : null,
        soldTotal,
        ratingAvg,
      };
    }),
  );

  // ── Constructor ──────────────────────────────────────────────────────────
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private productVariantService: ProductVariantService,
    private productVariantImageService: ProductVariantImageService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────
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

  // ── Load data ────────────────────────────────────────────────────────────
  /**
   * Bước 1: getAllProducts() → IListProducts[] (có main_image, price, rating)
   * Bước 2: forkJoin lấy variants của từng sản phẩm
   * Bước 3: forkJoin lấy images của từng variant
   */
  private loadData(): void {
    this.loading = true;

    this.productService
      .getAllProducts({})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const raw: IListProducts[] = Array.isArray(res.data) ? (res.data as any) : [];
          const products: ProductData[] = raw.map((item) => ({ ...item }));
          this.products$.next(products);

          if (!products.length) {
            this.loading = false;
            return;
          }

          forkJoin(products.map((p) => this.productVariantService.getAllVariantByProductId(p._id)))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (variantResponses) => {
                const allVariants = variantResponses.flatMap((r) => r.data ?? []);
                this.variants$.next(allVariants);

                if (!allVariants.length) {
                  this.loading = false;
                  this.cdr.detectChanges();
                  return;
                }

                forkJoin(
                  allVariants.map((v) =>
                    this.productVariantImageService.getAllImageByProductVariantId(v._id),
                  ),
                )
                  .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => {
                      this.loading = false;
                      this.cdr.detectChanges();
                    }),
                  )
                  .subscribe({
                    next: (imageResponses) => {
                      this.images$.next(imageResponses.flatMap((r) => r.data ?? []));
                    },
                    error: () => this.images$.next([]),
                  });
              },
              error: () => {
                this.variants$.next([]);
                this.loading = false;
                this.cdr.detectChanges();
              },
            });
        },
        error: () => {
          this.products$.next([]);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Merge dữ liệu Iproduct (từ getProductDetail) vào ProductData.
   * Giữ lại main_image, price, rating từ IListProducts.
   * Bổ sung image_url[], product_component, description, ... từ Iproduct.
   */
  private loadProductDetail(productId: string): void {
    this.productService
      .getProductDetail(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const { productInfo, defaultProductVariant, listMainImageDefaultProduct } = res.data;

          const products = this.products$.value.slice();
          const idx = products.findIndex((p) => p._id === productId);
          const existing = idx >= 0 ? products[idx] : ({} as ProductData);
          // Merge: IListProducts fields (existing) + Iproduct fields (productInfo)
          // existing được đặt sau để giữ main_image, price, rating từ danh sách
          const merged: ProductData = { ...productInfo, ...existing } as ProductData;

          if (idx >= 0) {
            products[idx] = merged;
          } else {
            products.push(merged);
          }
          this.products$.next(products);

          // Upsert variant mặc định
          const variants = this.variants$.value.slice();
          const vIdx = variants.findIndex((v) => v._id === defaultProductVariant._id);
          if (vIdx >= 0) {
            variants[vIdx] = defaultProductVariant;
          } else {
            variants.push(defaultProductVariant);
          }
          this.variants$.next(variants);

          // Replace images của variant mặc định
          const images = this.images$.value
            .filter((im) => im.product_varant !== defaultProductVariant._id)
            .concat(listMainImageDefaultProduct);
          this.images$.next(images);

          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  // ── Route binding ────────────────────────────────────────────────────────
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

      if (this.mode === 'edit') {
        this.initEditForm(incomingId);
      } else {
        this.clearEditState();
      }

      if (incomingId && incomingId !== 'new') {
        this.loadProductDetail(incomingId);
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

  // ── Query / Filter ───────────────────────────────────────────────────────
  patchQuery(patch: Partial<ListQuery>): void {
    const next = { ...this.query$.value, ...patch };
    const isFilterChange =
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

    if (isFilterChange && patch.page === undefined) next.page = 1;
    this.query$.next(next);
  }

  resetFilters(): void {
    this.localSearchTerm = '';
    const keepSort = { sortKey: this.query$.value.sortKey, sortDir: this.query$.value.sortDir };
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
    if (val.length === 0 || val.length >= 3) this.patchQuery({ q: val });
  }

  toggleSort(key: ListQuery['sortKey']): void {
    const q = this.query$.value;
    if (q.sortKey === key) {
      this.patchQuery({ sortDir: q.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.patchQuery({ sortKey: key, sortDir: 'asc' });
    }
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

  // ── Navigation ───────────────────────────────────────────────────────────
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
    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
  }

  onConfirmDiscard(): void {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.clearEditState();
    action?.();
  }

  onCancelDiscard(): void {
    this.discardModalOpen = false;
    this.pendingDiscardAction = null;
  }

  // ── Edit form ────────────────────────────────────────────────────────────
  private initEditForm(productId: string | null): void {
    this.editVariants = [];
    this.editImages = [];
    this.isCreateMode = productId === 'new';

    if (!productId) return;

    if (productId === 'new') {
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
      this.editVariants = [
        {
          product_varant_id: 'new-v1',
          is_default: true,
          price: 0,
          num_inventory: 0,
          num_selled: 0,
          rating: 0,
          weight: 0,
          designed_by: '',
          expected_delivery: '3-5 days',
          componentEntries: [],
          measurementEntries: [],
          images: [],
          expanded: true,
        },
      ];
      this.isDirty = false;
      this.detailTab = 'overview';
      return;
    }

    const p = this.products$.value.find((x) => x._id === productId) ?? null;
    if (!p) return;

    this.originalProductSnapshot = deepClone(p);
    this.editForm = {
      product_name: p.product_name ?? '',
      brand_name: p.brand ?? '',
      discount_percent: Number(p.discount_percent ?? 0),
      warranty: Number(p.warranty ?? 0),
      is_assembly: !!p.is_assembly,
      tagsText: normalizeTags(p.tags).join(', '),
      description: p.description ?? '',
    };

    const pv = this.variants$.value.filter((v) => v.product === productId);
    this.editVariants = pv.map((v) => ({
      product_varant_id: v._id,
      is_default: !!v.is_default,
      price: Number(v.price ?? 0),
      num_inventory: Number(v.num_inventory ?? 0),
      num_selled: Number(v.num_selled ?? 0),
      rating: Number(v.rating?.average ?? 0),
      weight: Number(v.weight ?? 0),
      designed_by: v.designed_by ?? '',
      expected_delivery: v.expected_delivery ?? '',
      componentEntries: Object.entries(v.measurement ?? {}).map(([key, value]) => ({
        key,
        value: String(value),
      })),
      measurementEntries: Object.entries(v.measurement ?? {}).map(([key, value]) => ({
        key,
        value: String(value),
      })),
      images: this.images$.value
        .filter((im) => im.product_varant === v._id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((im) => ({ url: im.url })),
      expanded: false,
    }));

    // Ảnh edit: ưu tiên image_url[] (Iproduct), fallback main_image (IListProducts)
    const imageUrlArr: string[] = Array.isArray(p.image_url)
      ? p.image_url
      : p.main_image
        ? [p.main_image]
        : [];
    this.editImages = imageUrlArr.map((url) => ({ url }));

    this.isDirty = false;
    this.detailTab = this.detailTab || 'overview';
  }

  onEditChange(): void {
    if (this.editForm) this.isDirty = true;
  }

  // ── Variant helpers ──────────────────────────────────────────────────────
  toggleVariantExpand(id: string): void {
    if (this.expandedVariants.has(id)) this.expandedVariants.delete(id);
    else this.expandedVariants.add(id);
  }

  isVariantExpanded(id: string): boolean {
    return this.expandedVariants.has(id);
  }

  variantPreviewLabel(v: VariantEditVM): string {
    if (!v.componentEntries?.length) return v.product_varant_id;
    return v.componentEntries
      .map((e) => e.value)
      .filter(Boolean)
      .join(' · ');
  }

  addComponentEntry(v: VariantEditVM): void {
    v.componentEntries.push({ key: '', value: '' });
    this.onVariantChange();
  }

  removeComponentEntry(v: VariantEditVM, idx: number): void {
    v.componentEntries.splice(idx, 1);
    this.onVariantChange();
  }

  addMeasurementEntry(v: VariantEditVM): void {
    v.measurementEntries.push({ key: '', value: '' });
    this.onVariantChange();
  }

  removeMeasurementEntry(v: VariantEditVM, idx: number): void {
    v.measurementEntries.splice(idx, 1);
    this.onVariantChange();
  }

  setDefaultVariant(v: VariantEditVM): void {
    this.editVariants.forEach((ev) => (ev.is_default = false));
    v.is_default = true;
    this.onVariantChange();
  }

  onVariantChange(): void {
    this.isDirty = true;
  }

  onUploadVariantImages(ev: Event, v: VariantEditVM): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    for (const f of files) v.images.push({ url: URL.createObjectURL(f), isNew: true });
    this.isDirty = true;
    input.value = '';
  }

  removeVariantImage(v: VariantEditVM, idx: number): void {
    const it = v.images[idx];
    if (!it) return;
    if (it.isNew) URL.revokeObjectURL(it.url);
    v.images.splice(idx, 1);
    this.isDirty = true;
  }

  onUploadEntryImage(ev: Event, entry: KVEntry): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    const f = files[0];
    if (f) {
      if (entry.image_url?.startsWith('blob:')) URL.revokeObjectURL(entry.image_url);
      entry.image_url = URL.createObjectURL(f);
      this.isDirty = true;
    }
    input.value = '';
  }

  removeEntryImage(entry: KVEntry): void {
    if (entry.image_url?.startsWith('blob:')) URL.revokeObjectURL(entry.image_url);
    delete entry.image_url;
    this.isDirty = true;
  }

  onUploadImages(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    for (const f of files) this.editImages.push({ url: URL.createObjectURL(f), isNew: true });
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

  // ── Save ─────────────────────────────────────────────────────────────────
  saveEdit(): void {
    if (!this.editForm) return;
    this.saveModalOpen = true;
  }

  executeSave(): void {
    if (!this.editForm) return;
    this.saveModalOpen = false;
    this.saving = true;
    if (this.isCreateMode) this._executeCreate();
    else this._executeUpdate();
  }

  private _executeCreate(): void {
    const newId = this.nextNumericProductId();
    const tags = parseTags(this.editForm!.tagsText);

    const newProduct = {
      _id: String(newId),
      product_name: this.editForm!.product_name.trim() || `New product ${newId}`,
      description: this.editForm!.description || '',
      discount_percent: clampNumber(this.editForm!.discount_percent, 0, 100),
      tags: tags.join(','), // string cho IListProducts
      price: 0,
      num_selled: 0,
      rating: 0,
      main_image: this.editImages[0]?.url ?? '',
      categories: [] as string[],
      // Iproduct fields
      brand: this.editForm!.brand_name.trim() || 'Unknown',
      is_assembly: !!this.editForm!.is_assembly,
      warranty: Math.max(0, Number(this.editForm!.warranty || 0)),
      important_functions: [] as string[],
      product_component: {} as Record<string, any>,
      image_url: this.editImages.map((x) => x.url),
      search_text: '',
    } as unknown as ProductData;

    const products = this.products$.value.slice();
    products.push(newProduct);
    this.products$.next(products);

    const variants = this.variants$.value.slice();
    const imgs = this.images$.value.slice();

    this.editVariants.forEach((vDraft, i) => {
      const vId = `${newId}-v${i + 1}`;
      const meas: Record<string, number> = {};
      vDraft.measurementEntries.forEach((e) => {
        if (e.key) meas[e.key] = Number(e.value) || 0;
      });

      variants.push({
        _id: vId,
        product: String(newId),
        sku: '',
        price: Number(vDraft.price ?? 0),
        weight: Number(vDraft.weight ?? 0),
        num_inventory: Number(vDraft.num_inventory ?? 0),
        num_selled: Number(vDraft.num_selled ?? 0),
        designed_by: vDraft.designed_by ?? '',
        rating: { average: Number(vDraft.rating ?? 0), count: 0 },
        expected_delivery: vDraft.expected_delivery ?? '',
        is_default: !!vDraft.is_default,
        measurement: meas,
      });

      vDraft.images.forEach((vIm, vImIdx) => {
        imgs.push({
          _id: `${vId}-img${vImIdx + 1}`,
          product_varant: vId,
          url: vIm.url,
          is_main: vImIdx === 0,
          position: vImIdx + 1,
        });
      });
    });

    this.variants$.next(variants);
    this.images$.next(imgs);
    this.saving = false;
    this.clearEditState();
    this.syncRoute(String(newId), 'detail', true);
  }

  private _executeUpdate(): void {
    if (!this.selectedProductId || this.selectedProductId === 'new') {
      this.saving = false;
      return;
    }

    const products = this.products$.value.slice();
    const idx = products.findIndex((x) => x._id === this.selectedProductId);
    if (idx >= 0) {
      const prev = products[idx];
      const tags = parseTags(this.editForm!.tagsText);
      products[idx] = {
        ...prev,
        product_name: this.editForm!.product_name.trim(),
        brand: this.editForm!.brand_name.trim(),
        discount_percent: clampNumber(this.editForm!.discount_percent, 0, 100),
        warranty: Math.max(0, Number(this.editForm!.warranty || 0)),
        is_assembly: !!this.editForm!.is_assembly,
        tags: tags,
        description: this.editForm!.description,
        image_url: this.editImages.map((x) => x.url),
        main_image: this.editImages[0]?.url ?? prev.main_image,
      } as ProductData;
      this.products$.next(products);
    }

    const variants = this.variants$.value.slice();
    const imgs = this.images$.value
      .slice()
      .filter((im) => !this.editVariants.some((ev) => ev.product_varant_id === im.product_varant));

    const vSet = new Map(this.editVariants.map((v) => [v.product_varant_id, v]));

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (v.product !== this.selectedProductId) continue;
      const draft = vSet.get(v._id);
      if (!draft) continue;

      const meas: Record<string, number> = {};
      draft.measurementEntries.forEach((e) => {
        if (e.key) meas[e.key] = Number(e.value) || 0;
      });

      variants[i] = {
        ...v,
        price: Number(draft.price ?? v.price),
        weight: Number(draft.weight ?? v.weight),
        num_inventory: Number(draft.num_inventory ?? v.num_inventory),
        expected_delivery: draft.expected_delivery ?? v.expected_delivery,
        is_default: !!draft.is_default,
        designed_by: draft.designed_by ?? v.designed_by,
        measurement: meas,
      };

      draft.images.forEach((vIm, vImIdx) => {
        imgs.push({
          _id: `${v._id}-img${vImIdx + 1}`,
          product_varant: v._id,
          url: vIm.url,
          is_main: vImIdx === 0,
          position: vImIdx + 1,
        });
      });
    }

    this.variants$.next(variants);
    this.images$.next(imgs);
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
    this.editImages = [];
  }

  // ── Export CSV ───────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────
  softDelete(productId: string): void {
    this.deleteItemId = productId;
    this.deleteItemType = 'product';
    this.deleteModalTitle = 'Xác nhận xóa sản phẩm';
    this.deleteModalMessage =
      'Bạn có chắc chắn muốn xóa sản phẩm này? Dữ liệu sẽ bị gỡ khỏi danh sách quản lý.';
    this.deleteModalOpen = true;
  }

  onConfirmDelete(): void {
    if (!this.deleteItemId) return;

    if (this.deleteItemType === 'product') {
      this.products$.next(this.products$.value.filter((p) => p._id !== this.deleteItemId));
      if (this.selectedProductId === this.deleteItemId) {
        this.clearEditState();
        this.syncRoute(null, 'list', true);
      }
    } else if (this.selectedProductId && this.selectedProductId !== 'new') {
      const list = this.getComments(this.selectedProductId).filter(
        (x) => x.id !== this.deleteItemId,
      );
      this.commentsByProduct.set(this.selectedProductId, list);
      this.isDirty = true;
    }

    this.deleteModalOpen = false;
    this.deleteItemId = null;
  }

  onCancelDelete(): void {
    this.deleteModalOpen = false;
    this.deleteItemId = null;
  }

  // ── Comments ─────────────────────────────────────────────────────────────
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

  // ── Status helpers ───────────────────────────────────────────────────────
  headerStatusLabel(inventoryTotal: number): string {
    if (inventoryTotal <= 0) return 'Hết hàng';
    if (inventoryTotal <= this.query$.value.lowStockThreshold) return 'Sắp hết';
    return 'Đang bán';
  }

  headerStatusClass(inventoryTotal: number): string {
    if (inventoryTotal <= 0) return 'hb-pill-danger';
    if (inventoryTotal <= this.query$.value.lowStockThreshold) return 'hb-pill-warn';
    return 'hb-pill-ok';
  }

  stopEvent(ev: Event): void {
    ev.stopPropagation();
  }

  private nextNumericProductId(): number {
    const ids = this.products$.value
      .map((p) => toNumberSafe(p._id))
      .filter((n) => Number.isFinite(n)) as number[];
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }
}

// ─── Pure utility functions ───────────────────────────────────────────────────

/**
 * IListProducts.tags là string (comma-separated)
 * Iproduct.tags là string[]
 * → chuẩn hóa về string[]
 */
function normalizeTags(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Resolve ảnh bìa theo thứ tự ưu tiên:
 * 1. main_image  — có ngay sau getAllProducts()
 * 2. is_main image của variant default — có sau loadProductDetail()
 * 3. image_url[0] — có sau loadProductDetail()
 */
function resolveMainImage(
  p: ProductData,
  pv: Iproduct_variants[],
  images: Iproduct_variants_image[],
): string | null {
  if (p.main_image) return p.main_image;

  const defaultVariant = pv.find((x) => x.is_default) ?? pv[0];
  if (defaultVariant) {
    const main = images.find((im) => im.product_varant === defaultVariant._id && im.is_main);
    if (main?.url) return main.url;
  }

  return Array.isArray(p.image_url) && p.image_url.length ? (p.image_url[0] ?? null) : null;
}

function inferRoomFromProduct(p: ProductData): string {
  const tags = normalizeTags(p.tags).join(' ').toLowerCase();
  const imgs = (Array.isArray(p.image_url) ? p.image_url : []).join(' ').toLowerCase();
  if (tags.includes('living room') || imgs.includes('living_room')) return 'Phòng khách';
  if (tags.includes('bedroom') || imgs.includes('bedroom')) return 'Phòng ngủ';
  if (tags.includes('dining') || imgs.includes('dining_room')) return 'Phòng ăn';
  if (tags.includes('office') || imgs.includes('office')) return 'Phòng làm việc';
  return 'Khác';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clampNumber(v: any, min: number, max: number): number {
  const n = Number(v);
  return Number.isNaN(n) ? min : clamp(n, min, max);
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
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
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
  return [
    {
      id: 'cmt-001',
      userName: 'Mai Anh',
      rating: 5,
      content: 'Chất lượng tốt, form chắc. Giao nhanh hơn dự kiến.',
      createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-002',
      userName: 'Nguyễn Khánh Xuân',
      rating: 4,
      content: 'Màu đúng như hình. Lắp ráp hơi mất thời gian nhưng ổn.',
      createdAt: new Date(Date.now() - 864e5 * 5).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-003',
      userName: 'Võ Hồng Phúc',
      rating: 5,
      content: 'Ngồi êm, vải đẹp. Sẽ mua thêm cho phòng ngủ.',
      createdAt: new Date(Date.now() - 864e5 * 8).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-004',
      userName: 'Nguyễn Minh Quân',
      rating: 3,
      content: 'Đóng gói tốt. Tuy nhiên giao chậm 1 ngày so với hẹn.',
      createdAt: new Date(Date.now() - 864e5 * 12).toISOString(),
      hidden: false,
    },
    {
      id: 'cmt-005',
      userName: 'Nguyễn Quang Phúc',
      rating: 4,
      content: 'Giá hợp lý, nhìn sang. Hy vọng dùng lâu bền.',
      createdAt: new Date(Date.now() - 864e5 * 18).toISOString(),
      hidden: false,
    },
  ].map((x) => ({ ...x, productId }));
}
