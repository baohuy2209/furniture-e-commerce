import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

type SortDir = 'asc' | 'desc';
type ReferenceType = 'purchase_order' | 'order' | 'manual' | 'audit';

type AdjustType = 'inbound' | 'manual';
type ManualDirection = 'increase' | 'decrease';

type StockSortKey =
  | 'product_variant_id'
  | 'sku'
  | 'warehouse'
  | 'status'
  | 'quantity_on_hand'
  | 'updated_at';

interface WarehouseEntity {
  warehouse_id: string;
  name: string;
  address_warehouse: string;
  warehouse_area: number;
  warehouse_status: 1 | 0;
  created_at: string;
  updated_at: string;
}

interface ProductVariantMin {
  product_variant_id: string;
  product_id?: string;
  sku?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
}

interface StockItemEntity {
  stock_item_id: string;
  product_variant_id: string;
  warehouse_id: string;

  quantity_on_hand: number;
  quantity_reserved: number;

  reorder_point: number;
  created_at: string;
  updated_at: string;
}

interface StockMovementEntity {
  movement_id: string;
  warehouse_id: string;
  product_variant_id: string;

  reference_id: string;
  reference_type: ReferenceType;

  quantity_changed: number;
  reason: string;

  created_at: string;
  updated_at: string;
}

interface StockRowVM {
  stock_item_id: string;

  product_variant_id: string;
  sku: string;
  product_id: string;

  warehouse_id: string;
  warehouse_name: string;

  quantity_on_hand: number;

  reorder_point: number;
  low_stock: boolean;

  updated_at: string;
  updatedAtText: string;

  qtyText: string;

  statusLabel: string;
  statusPillClass: string;
}

interface MovementRowVM {
  movement_id: string;
  createdAtText: string;

  reference_type: ReferenceType;
  reference_id: string;

  signText: 'IN' | 'OUT';
  qtyText: string;

  reason: string;
}

interface SummaryVM {
  totalSkus: number;
  lowStockCount: number;
  totalOnHandValueText: string;
}

interface StockDetailVM {
  stock: StockItemEntity;
  warehouse: WarehouseEntity | null;
  variant: ProductVariantMin | null;

  statusLabel: string;
  statusPillClass: string;

  onHandText: string;
  updatedAtText: string;

  recentMovements: MovementRowVM[];
}

interface StockAdjustDraft {
  adjustType: AdjustType;
  qtyAbs: number;

  direction?: ManualDirection;

  reference_type: ReferenceType;
  reference_id: string;

  reason: string;
}

type Mode = 'list' | 'detail' | 'edit';

interface VM {
  mode: Mode;

  summary: SummaryVM;
  rowsStock: StockRowVM[];

  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  showingFrom: number;
  showingTo: number;

  sortKeyStock: StockSortKey;
  sortDirStock: SortDir;

  warehouses: WarehouseEntity[];

  selectedId: string | null;
  detail: StockDetailVM | null;

  editModel: StockAdjustDraft | null;

  currentPanel: 'detail' | 'adjust' | null;
}

@Component({
  selector: 'app-management-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management-warehouse.html',
  styleUrls: ['./management-warehouse.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementWarehouse implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ✅ FIX: ensure takeUntilDestroyed has a valid DestroyRef context
  private destroyRef = inject(DestroyRef);

  private warehouses$ = new BehaviorSubject<WarehouseEntity[]>(MOCK_WAREHOUSES);
  private variants$ = new BehaviorSubject<ProductVariantMin[]>(MOCK_VARIANTS);
  private stockItems$ = new BehaviorSubject<StockItemEntity[]>(MOCK_STOCK_ITEMS);
  private movements$ = new BehaviorSubject<StockMovementEntity[]>(MOCK_MOVEMENTS);

  private routeState$ = new BehaviorSubject<{ id: string | null; panel: 'adjust' | null }>({
    id: null,
    panel: null,
  });

  private editModel$ = new BehaviorSubject<StockAdjustDraft | null>(null);

  q = '';
  f_warehouse_id = '';
  f_low_only = false;

  private q$ = new BehaviorSubject<string>('');
  private wh$ = new BehaviorSubject<string>('');
  private lowOnly$ = new BehaviorSubject<boolean>(false);

  private sortKeyStock$ = new BehaviorSubject<StockSortKey>('updated_at');
  private sortDirStock$ = new BehaviorSubject<SortDir>('desc');

  page = 1;
  pageSize = 10;

  private page$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);

  ngOnInit(): void {
    // ✅ FIX: pass DestroyRef explicitly so query-param changes always propagate
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const id = pm.get('id');
      const panelRaw = pm.get('panel');
      const panel = panelRaw === 'adjust' ? 'adjust' : null;

      this.routeState$.next({ id, panel });

      if (id && panel === 'adjust') {
        if (!this.editModel$.value) this.seedAdjustDraft();
      } else {
        this.editModel$.next(null);
      }
    });
  }

  vm$ = combineLatest([
    this.routeState$,
    this.editModel$,
    this.warehouses$,
    this.variants$,
    this.stockItems$,
    this.movements$,
    this.q$,
    this.wh$,
    this.lowOnly$,
    this.page$,
    this.pageSize$,
    this.sortKeyStock$,
    this.sortDirStock$,
  ]).pipe(
    map(
      ([
        routeState,
        editModel,
        warehouses,
        variants,
        stockItems,
        movements,
        q,
        whId,
        lowOnly,
        page,
        pageSize,
        sortKeyStock,
        sortDirStock,
      ]) => {
        const { id: selectedId, panel } = routeState;
        const mode: Mode = !selectedId ? 'list' : panel === 'adjust' ? 'edit' : 'detail';

        const variantMap = new Map<string, ProductVariantMin>(
          variants.map((v) => [v.product_variant_id, v]),
        );
        const whMap = new Map<string, WarehouseEntity>(warehouses.map((w) => [w.warehouse_id, w]));

        const baseStock: StockRowVM[] = stockItems.map((si) => {
          const v = variantMap.get(si.product_variant_id) ?? null;
          const w = whMap.get(si.warehouse_id) ?? null;

          const reorder = si.reorder_point ?? DEFAULT_REORDER_POINT;
          const low = si.quantity_on_hand < reorder;

          const statusLabel = low ? 'Low stock' : 'Ổn định';
          const statusClass = low ? 'pill-warn' : 'pill-ok';

          return {
            stock_item_id: si.stock_item_id,
            product_variant_id: si.product_variant_id,
            sku: safeText(v?.sku),
            product_id: safeText(v?.product_id),
            warehouse_id: si.warehouse_id,
            warehouse_name: w?.name ?? si.warehouse_id,
            quantity_on_hand: si.quantity_on_hand,
            reorder_point: reorder,
            low_stock: low,
            updated_at: si.updated_at,
            updatedAtText: fmtDate(si.updated_at),
            qtyText: String(si.quantity_on_hand),
            statusLabel,
            statusPillClass: statusClass,
          };
        });

        const totalSkus = baseStock.length;
        const lowStockCount = baseStock.filter((x) => x.low_stock).length;
        const totalOnHandValue = baseStock.reduce((acc, r) => {
          const price = Number(variantMap.get(r.product_variant_id)?.price ?? 0);
          return acc + r.quantity_on_hand * (Number.isFinite(price) ? price : 0);
        }, 0);

        const summary: SummaryVM = {
          totalSkus,
          lowStockCount,
          totalOnHandValueText: money(totalOnHandValue),
        };

        const key = q.trim().toLowerCase();
        let filtered = baseStock
          .filter((r) => (whId ? r.warehouse_id === whId : true))
          .filter((r) => (lowOnly ? r.low_stock : true))
          .filter((r) => {
            if (!key) return true;
            const hay =
              `${r.product_variant_id} ${r.sku} ${r.product_id} ${r.warehouse_name}`.toLowerCase();
            return hay.includes(key);
          });

        filtered = filtered.sort((a, b) => {
          const dir = sortDirStock === 'asc' ? 1 : -1;
          const av = getStockSortValue(a, sortKeyStock);
          const bv = getStockSortValue(b, sortKeyStock);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);

        const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const to = Math.min(total, safePage * pageSize);

        const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

        let detailVM: StockDetailVM | null = null;
        if (selectedId) {
          const s = stockItems.find((x) => x.stock_item_id === selectedId) ?? null;
          if (s) {
            const w = whMap.get(s.warehouse_id) ?? null;
            const v = variantMap.get(s.product_variant_id) ?? null;

            const reorder = s.reorder_point ?? DEFAULT_REORDER_POINT;
            const low = s.quantity_on_hand < reorder;

            const statusLabel = low ? 'Low stock' : 'Ổn định';
            const statusClass = low ? 'pill-warn' : 'pill-ok';

            const recent = movements
              .filter(
                (m) =>
                  m.product_variant_id === s.product_variant_id &&
                  m.warehouse_id === s.warehouse_id,
              )
              .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
              .slice(0, 6)
              .map((m) => movementToVM(m));

            detailVM = {
              stock: s,
              warehouse: w,
              variant: v,
              statusLabel,
              statusPillClass: statusClass,
              onHandText: String(s.quantity_on_hand),
              updatedAtText: fmtDate(s.updated_at),
              recentMovements: recent,
            };
          }
        }

        const vm: VM = {
          mode,
          summary,
          rowsStock: pageRows,
          total,
          page: safePage,
          pageSize,
          totalPages,
          showingFrom: from,
          showingTo: to,
          sortKeyStock,
          sortDirStock,
          warehouses,
          selectedId,
          detail: detailVM,
          editModel,
          currentPanel: !selectedId ? null : panel === 'adjust' ? 'adjust' : 'detail',
        };

        return vm;
      },
    ),
  );

  onChangeQ(v: string) {
    this.q = v;
    this.q$.next(v);
    this.setPage(1);
  }

  onChangeWarehouse(v: string) {
    this.f_warehouse_id = v;
    this.wh$.next(v);
    this.setPage(1);
  }

  onToggleLowOnly(v: boolean) {
    this.f_low_only = !!v;
    this.lowOnly$.next(!!v);
    this.setPage(1);
  }

  onChangePageSize(v: number) {
    this.pageSize = Number(v);
    this.pageSize$.next(this.pageSize);
    this.setPage(1);
  }

  resetFilters() {
    this.q = '';
    this.f_warehouse_id = '';
    this.f_low_only = false;

    this.q$.next('');
    this.wh$.next('');
    this.lowOnly$.next(false);

    this.sortKeyStock$.next('updated_at');
    this.sortDirStock$.next('desc');

    this.pageSize = 10;
    this.pageSize$.next(10);
    this.setPage(1);
  }

  toggleSortStock(key: StockSortKey) {
    const curKey = this.sortKeyStock$.value;
    const curDir = this.sortDirStock$.value;

    if (curKey === key) this.sortDirStock$.next(curDir === 'asc' ? 'desc' : 'asc');
    else {
      this.sortKeyStock$.next(key);
      this.sortDirStock$.next('asc');
    }
  }

  setPage(p: number) {
    this.page = p;
    this.page$.next(p);
  }

  openDetail(stockItemId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: stockItemId, panel: null },
      queryParamsHandling: 'merge',
    });
  }

  openAdjust(stockItemId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: stockItemId, panel: 'adjust' },
      queryParamsHandling: 'merge',
    });
  }

  goList() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null, panel: null },
      queryParamsHandling: 'merge',
    });
  }

  enterEdit() {
    const cur = this.routeState$.value.id;
    if (!cur) return;
    this.openAdjust(cur);
  }

  cancelEdit() {
    const cur = this.routeState$.value.id;
    if (!cur) return;
    this.openDetail(cur);
  }

  private seedAdjustDraft() {
    const draft: StockAdjustDraft = {
      adjustType: 'inbound',
      qtyAbs: 1,
      direction: 'increase',
      reference_type: 'manual',
      reference_id: '',
      reason: '',
    };
    this.editModel$.next(draft);
  }

  saveEdit() {
    const selected = this.routeState$.value.id;
    const em = this.editModel$.value;
    if (!selected || !em) return;

    const stock = this.stockItems$.value.find((x) => x.stock_item_id === selected);
    if (!stock) return;

    const qtyAbs = Math.max(0, Number(em.qtyAbs ?? 0));
    if (!qtyAbs) return;

    if (em.adjustType === 'manual' && !String(em.reason ?? '').trim()) return;

    let delta = qtyAbs;
    if (em.adjustType === 'manual') {
      const dir = (em.direction ?? 'increase') as ManualDirection;
      delta = dir === 'decrease' ? -qtyAbs : qtyAbs;
    }

    const updatedStock: StockItemEntity = {
      ...stock,
      quantity_on_hand: Math.max(0, stock.quantity_on_hand + delta),
      updated_at: new Date().toISOString(),
    };

    this.stockItems$.next(
      this.stockItems$.value.map((s) =>
        s.stock_item_id === updatedStock.stock_item_id ? updatedStock : s,
      ),
    );

    const mv: StockMovementEntity = {
      movement_id: `mv_${id16()}`,
      warehouse_id: stock.warehouse_id,
      product_variant_id: stock.product_variant_id,
      reference_type: (em.reference_type ?? 'manual') as ReferenceType,
      reference_id: String(em.reference_id ?? ''),
      quantity_changed: delta,
      reason: String(em.reason ?? ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.movements$.next([mv, ...this.movements$.value]);

    this.editModel$.next(null);
    this.openDetail(selected);
  }

  exportCsvStock() {
    const rows = this.buildCsvRowsCurrent();
    const header = ['VariantId', 'SKU', 'ProductId', 'Warehouse', 'Status', 'OnHand', 'UpdatedAt'];

    const lines = rows.map((r) =>
      [
        r.product_variant_id,
        r.sku,
        r.product_id,
        r.warehouse_name,
        r.statusLabel,
        r.quantity_on_hand,
        r.updatedAtText,
      ]
        .map(csvEsc)
        .join(','),
    );

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse_stock_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private buildCsvRowsCurrent(): StockRowVM[] {
    const warehouses = this.warehouses$.value;
    const variants = this.variants$.value;
    const stockItems = this.stockItems$.value;

    const variantMap = new Map<string, ProductVariantMin>(
      variants.map((v) => [v.product_variant_id, v]),
    );
    const whMap = new Map<string, WarehouseEntity>(warehouses.map((w) => [w.warehouse_id, w]));

    const base: StockRowVM[] = stockItems.map((si) => {
      const v = variantMap.get(si.product_variant_id) ?? null;
      const w = whMap.get(si.warehouse_id) ?? null;

      const reorder = si.reorder_point ?? DEFAULT_REORDER_POINT;
      const low = si.quantity_on_hand < reorder;

      return {
        stock_item_id: si.stock_item_id,
        product_variant_id: si.product_variant_id,
        sku: safeText(v?.sku),
        product_id: safeText(v?.product_id),
        warehouse_id: si.warehouse_id,
        warehouse_name: w?.name ?? si.warehouse_id,
        quantity_on_hand: si.quantity_on_hand,
        reorder_point: reorder,
        low_stock: low,
        updated_at: si.updated_at,
        updatedAtText: fmtDate(si.updated_at),
        qtyText: String(si.quantity_on_hand),
        statusLabel: low ? 'Low stock' : 'Ổn định',
        statusPillClass: low ? 'pill-warn' : 'pill-ok',
      };
    });

    const key = this.q.trim().toLowerCase();
    return base
      .filter((r) => (this.f_warehouse_id ? r.warehouse_id === this.f_warehouse_id : true))
      .filter((r) => (this.f_low_only ? r.low_stock : true))
      .filter((r) => {
        if (!key) return true;
        const hay =
          `${r.product_variant_id} ${r.sku} ${r.product_id} ${r.warehouse_name}`.toLowerCase();
        return hay.includes(key);
      });
  }

  stopEvent(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
}

const DEFAULT_REORDER_POINT = 5;

function getStockSortValue(r: StockRowVM, key: StockSortKey): any {
  switch (key) {
    case 'product_variant_id':
      return r.product_variant_id.toLowerCase();
    case 'sku':
      return r.sku.toLowerCase();
    case 'warehouse':
      return r.warehouse_name.toLowerCase();
    case 'status':
      return r.low_stock ? 0 : 1;
    case 'quantity_on_hand':
      return r.quantity_on_hand;
    case 'updated_at':
      return +new Date(r.updated_at);
  }
}

function movementToVM(m: StockMovementEntity): MovementRowVM {
  const signText: 'IN' | 'OUT' = m.quantity_changed >= 0 ? 'IN' : 'OUT';
  return {
    movement_id: m.movement_id,
    createdAtText: fmtDate(m.created_at),
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    signText,
    qtyText: String(Math.abs(m.quantity_changed)),
    reason: m.reason,
  };
}

function safeText(v: any) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function money(v: number) {
  const n = Math.round(v);
  return n.toLocaleString('vi-VN') + ' đ';
}

function csvEsc(v: any) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function id16() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const MOCK_WAREHOUSES: WarehouseEntity[] = [
  {
    warehouse_id: 'WH_HCM_Q7',
    name: 'Kho HCM - Quận 7',
    address_warehouse: 'Q7, TP.HCM',
    warehouse_area: 450,
    warehouse_status: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    warehouse_id: 'WH_HN_CG',
    name: 'Kho HN - Cầu Giấy',
    address_warehouse: 'Cầu Giấy, Hà Nội',
    warehouse_area: 320,
    warehouse_status: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

const MOCK_VARIANTS: ProductVariantMin[] = [
  { product_variant_id: 'pv_001', product_id: 'p_001', sku: 'SKU-001', price: 1200000 },
  { product_variant_id: 'pv_002', product_id: 'p_002', sku: 'SKU-002', price: 980000 },
  { product_variant_id: 'pv_003', product_id: 'p_003', sku: 'SKU-003', price: 1500000 },
  { product_variant_id: 'pv_004', product_id: 'p_004', sku: 'SKU-004', price: 1100000 },
];

const now = Date.now();
const MOCK_STOCK_ITEMS: StockItemEntity[] = [
  {
    stock_item_id: 'si_001',
    product_variant_id: 'pv_001',
    warehouse_id: 'WH_HCM_Q7',
    quantity_on_hand: 13,
    quantity_reserved: 2,
    reorder_point: 5,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 20).toISOString(),
  },
  {
    stock_item_id: 'si_002',
    product_variant_id: 'pv_002',
    warehouse_id: 'WH_HCM_Q7',
    quantity_on_hand: 3,
    quantity_reserved: 0,
    reorder_point: 5,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 20).toISOString(),
  },
  {
    stock_item_id: 'si_003',
    product_variant_id: 'pv_003',
    warehouse_id: 'WH_HN_CG',
    quantity_on_hand: 7,
    quantity_reserved: 1,
    reorder_point: 5,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60).toISOString(),
  },
  {
    stock_item_id: 'si_004',
    product_variant_id: 'pv_004',
    warehouse_id: 'WH_HN_CG',
    quantity_on_hand: 2,
    quantity_reserved: 0,
    reorder_point: 5,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 90).toISOString(),
  },
];

const MOCK_MOVEMENTS: StockMovementEntity[] = [
  {
    movement_id: 'mv_001',
    warehouse_id: 'WH_HCM_Q7',
    product_variant_id: 'pv_001',
    reference_type: 'purchase_order',
    reference_id: 'PO_001',
    quantity_changed: 20,
    reason: 'Nhập PO',
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    movement_id: 'mv_002',
    warehouse_id: 'WH_HCM_Q7',
    product_variant_id: 'pv_001',
    reference_type: 'order',
    reference_id: 'OD_8891',
    quantity_changed: -8,
    reason: 'Xuất theo đơn',
    created_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  },
];
