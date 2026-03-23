import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type ReferenceType = 'purchase_order' | 'order' | 'manual' | 'audit';
type AdjustType = 'IN' | 'OUT' | 'ADJUST';
type POStatus = 'pending' | 'confirmed' | 'receiving' | 'completed' | 'cancelled';

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

interface BrandEntity {
  _id: string;
  brand_name: string;
}

const MOCK_BRANDS: BrandEntity[] = [
  { _id: 'br_001', brand_name: 'Nhà cung cấp Hòa Phát' },
  { _id: 'br_002', brand_name: 'Xưởng Mộc Ý Tưởng' },
  { _id: 'br_003', brand_name: 'Nhập khẩu Q-Home' }
];

interface POEntity {
  po_id: string;
  po_number: string;
  brand_id: string;
  brand_name: string;
  note: string;
  status: POStatus;
  item_count: number;
  total_cost: number;
  created_at: string;
}

interface POListItemVM {
  po_id: string;
  po_number: string;
  brand_name: string;
  note: string;
  status: POStatus;
  itemCount: number;
  totalCostText: string;
  createdAtText: string;
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
  stt: number;
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
  targetWarehouseId: string;
  qtyAbs: number;
  reason: string;
}

interface PurchaseOrderItemDraft {
  id: string;
  product_variant_id: string;
  warehouse_id: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseOrderDraft {
  brand_id: string;
  note: string;
  tempItem: {
    product_variant_id: string;
    warehouse_id: string;
    quantity: number;
    unit_cost: number;
  };
  items: PurchaseOrderItemDraft[];
}

type Mode = 'list' | 'detail' | 'edit' | 'create_po';

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
  importDraft: PurchaseOrderDraft | null;
  importStep: 1 | 2;
  importPreviewList: {
    id: string;
    sku: string;
    warehouseName: string;
    currentStock: number;
    expectedStock: number;
    quantity: number;
    unit_cost: number;
    subtotal: number;
  }[];
  importTotalCost: number;
  brands: BrandEntity[];
  currentPanel: 'detail' | 'adjust' | 'import' | null;
  poList: POListItemVM[];
  transferList: MovementRowVM[];
}

@Component({
  selector: 'app-management-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './management-warehouse.html',
  styleUrls: ['./management-warehouse.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementWarehouse implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private warehouses$ = new BehaviorSubject<WarehouseEntity[]>(MOCK_WAREHOUSES);
  private variants$ = new BehaviorSubject<ProductVariantMin[]>(MOCK_VARIANTS);
  private stockItems$ = new BehaviorSubject<StockItemEntity[]>(MOCK_STOCK_ITEMS);
  private movements$ = new BehaviorSubject<StockMovementEntity[]>(MOCK_MOVEMENTS);
  private poItems$ = new BehaviorSubject<POEntity[]>(MOCK_PO_LIST);

  private routeState$ = new BehaviorSubject<{ id: string | null; edit: boolean; createPO: boolean }>({
    id: null,
    edit: false,
    createPO: false,
  });

  private editModel$ = new BehaviorSubject<StockAdjustDraft | null>(null);
  private importDraft$ = new BehaviorSubject<PurchaseOrderDraft | null>(null);
  private importStep$ = new BehaviorSubject<1 | 2>(1);
  private originalEditSnapshot: string | null = null;
  private pendingDiscardAction: (() => void) | null = null;

  saveModalOpen = false;
  discardModalOpen = false;
  invalidSaveModalOpen = false;

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
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const id = pm.get('id');
      const edit = pm.get('edit') === 'true';
      const createPO = pm.get('action') === 'create_po';

      const prev = this.routeState$.value;
      const next = { id, edit, createPO };

      if (prev.id === next.id && prev.edit === next.edit && prev.createPO === next.createPO) return;

      this.routeState$.next(next);

      if (createPO) {
        this.clearEditState();
        if (!this.importDraft$.value) {
          this.importDraft$.next({
            brand_id: '',
            note: '',
            tempItem: { warehouse_id: '', product_variant_id: '', quantity: 1, unit_cost: 0 },
            items: []
          });
          this.importStep$.next(1);
        }
      } else if (id && edit) {
        this.seedAdjustDraft();
        this.importDraft$.next(null);
      } else {
        this.clearEditState();
        this.importDraft$.next(null);
      }
    });
  }

  vm$ = combineLatest([
    this.routeState$,
    this.editModel$,
    this.importDraft$,
    this.importStep$,
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
    this.poItems$,
  ]).pipe(
    map(
      ([
        routeState,
        editModel,
        importDraft,
        importStep,
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
        poItems,
      ]) => {
        const { id: selectedId, edit, createPO } = routeState;
        const mode: Mode = createPO ? 'create_po' : !selectedId ? 'list' : edit ? 'edit' : 'detail';

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
            stt: 0,
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

        const pageRows = filtered
          .slice((safePage - 1) * pageSize, safePage * pageSize)
          .map((r, i) => ({
            ...r,
            stt: (safePage - 1) * pageSize + i + 1,
          }));

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

        let importPreviewList = [];
        let importTotalCost = 0;
        if (createPO && importDraft) {
          for (const item of importDraft.items) {
            const w = whMap.get(item.warehouse_id);
            const v = variantMap.get(item.product_variant_id);
            const currentStock = stockItems.find(s => s.warehouse_id === item.warehouse_id && s.product_variant_id === item.product_variant_id)?.quantity_on_hand || 0;
            const cost = item.quantity * item.unit_cost;
            importTotalCost += cost;
            importPreviewList.push({
              id: item.id,
              sku: v ? v.sku || item.product_variant_id : item.product_variant_id,
              warehouseName: w ? w.name : item.warehouse_id,
              currentStock: currentStock,
              expectedStock: currentStock + item.quantity,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
              subtotal: cost
            });
          }
        }

        // Build PO list VM
        const poList: POListItemVM[] = poItems
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .map(po => ({
            po_id: po.po_id,
            po_number: po.po_number,
            brand_name: po.brand_name,
            note: po.note,
            status: po.status,
            itemCount: po.item_count,
            totalCostText: money(po.total_cost),
            createdAtText: fmtDate(po.created_at),
          }));

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
          importDraft,
          importStep,
          importPreviewList,
          importTotalCost,
          brands: MOCK_BRANDS,
          currentPanel: createPO ? 'import' : !selectedId ? null : edit ? 'adjust' : 'detail',
          poList,
          transferList: movements
            .filter(m => m.reference_type === 'manual')
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
            .map(m => movementToVM(m)),
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

    if (curKey === key) {
      this.sortDirStock$.next(curDir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKeyStock$.next(key);
      this.sortDirStock$.next('asc');
    }
  }

  setPage(p: number) {
    this.page = p;
    this.page$.next(p);
  }

  openDetail(stockItemId: string) {
    this.syncRoute(stockItemId, 'detail');
  }

  openAdjust(stockItemId: string) {
    this.syncRoute(stockItemId, 'edit');
  }

  openCreatePO() {
    this.importStep$.next(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'create_po' },
      queryParamsHandling: 'merge',
    });
  }

  nextImportStep() {
    this.importStep$.next(2);
  }

  prevImportStep() {
    this.importStep$.next(1);
  }

  cancelCreatePO() {
    this.goList();
  }

  goList() {
    this.attemptLeave(() => {
      this.syncRoute(null, 'list');
    });
  }

  enterEdit() {
    const cur = this.routeState$.value.id;
    if (!cur) return;
    this.syncRoute(cur, 'edit');
  }

  onHeaderBack() {
    const state = this.routeState$.value;
    if (state.id && state.edit) {
      this.backToDetail();
      return;
    }
    this.goList();
  }

  backToDetail() {
    const cur = this.routeState$.value.id;
    if (!cur) {
      this.goList();
      return;
    }

    this.attemptLeave(() => {
      this.syncRoute(cur, 'detail');
    });
  }

  updateAdjustTarget(warehouseId: string) {
    const cur = this.editModel$.value;
    if (!cur) return;
    const next = { ...cur, targetWarehouseId: warehouseId };
    this.editModel$.next(next);
  }

  updateAdjustQty(v: number) {
    const cur = this.editModel$.value;
    if (!cur) return;
    const next = { ...cur, qtyAbs: Number(v ?? 0) };
    this.editModel$.next(next);
  }

  updateAdjustReason(v: string) {
    const cur = this.editModel$.value;
    if (!cur) return;
    const next = { ...cur, reason: v };
    this.editModel$.next(next);
  }

  get isDirty(): boolean {
    const cur = this.editModel$.value;
    if (!cur || !this.originalEditSnapshot) return false;
    return JSON.stringify(cur) !== this.originalEditSnapshot;
  }

  saveEdit() {
    const em = this.editModel$.value;
    if (!em || !String(em.reason || '').trim()) {
      this.invalidSaveModalOpen = true;
      return;
    }
    this.saveModalOpen = true;
  }

  onCancelSave() {
    this.saveModalOpen = false;
  }

  onConfirmDiscard() {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.clearEditState();
    action?.();
  }

  onCancelDiscard() {
    this.discardModalOpen = false;
    this.pendingDiscardAction = null;
  }

  executeSave() {
    const selected = this.routeState$.value.id;
    const em = this.editModel$.value;

    if (!selected || !em || !String(em.reason || '').trim()) {
      this.saveModalOpen = false;
      return;
    }

    const stock = this.stockItems$.value.find((x) => x.stock_item_id === selected);
    if (!stock) {
      this.saveModalOpen = false;
      return;
    }

    const qtyAbs = Math.max(0, Number(em.qtyAbs ?? 0));
    if (!qtyAbs || !em.targetWarehouseId) {
      this.saveModalOpen = false;
      return;
    }

    const updatedSourceStock: StockItemEntity = {
      ...stock,
      quantity_on_hand: Math.max(0, stock.quantity_on_hand - qtyAbs),
      updated_at: new Date().toISOString(),
    };

    // Find or create target stock
    let allStocks = [...this.stockItems$.value];
    let targetStock = allStocks.find(
      (x) => x.product_variant_id === stock.product_variant_id && x.warehouse_id === em.targetWarehouseId
    );

    if (targetStock) {
      const updatedTargetStock: StockItemEntity = {
        ...targetStock,
        quantity_on_hand: targetStock.quantity_on_hand + qtyAbs,
        updated_at: new Date().toISOString(),
      };
      allStocks = allStocks.map(s => s.stock_item_id === updatedTargetStock.stock_item_id ? updatedTargetStock : s);
    } else {
      const newTargetStock: StockItemEntity = {
        stock_item_id: `si_${id16()}`,
        product_variant_id: stock.product_variant_id,
        warehouse_id: em.targetWarehouseId,
        quantity_on_hand: qtyAbs,
        quantity_reserved: 0,
        reorder_point: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      allStocks.push(newTargetStock);
    }

    // Update source
    allStocks = allStocks.map(s => s.stock_item_id === updatedSourceStock.stock_item_id ? updatedSourceStock : s);

    this.stockItems$.next(allStocks);

    const refId = `TRF-${id16().slice(0, 6)}`;

    // Log OUT for source
    const mvOut: StockMovementEntity = {
      movement_id: `mv_${id16()}`,
      warehouse_id: stock.warehouse_id,
      product_variant_id: stock.product_variant_id,
      reference_type: 'manual',
      reference_id: refId,
      quantity_changed: -qtyAbs,
      reason: String(em.reason ?? ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Log IN for target
    const mvIn: StockMovementEntity = {
      movement_id: `mv_${id16()}`,
      warehouse_id: em.targetWarehouseId,
      product_variant_id: stock.product_variant_id,
      reference_type: 'manual',
      reference_id: refId,
      quantity_changed: qtyAbs,
      reason: String(em.reason ?? ''),
      created_at: new Date(new Date().getTime() + 100).toISOString(),
      updated_at: new Date(new Date().getTime() + 100).toISOString(),
    };

    this.movements$.next([mvIn, mvOut, ...this.movements$.value]);

    this.saveModalOpen = false;
    this.clearEditState();
    this.syncRoute(selected, 'detail');
  }

  executePO() {
    const draft = this.importDraft$.value;
    if (!draft || draft.items.length === 0) {
      return;
    }

    let stockItems = [...this.stockItems$.value];
    let newMovements: StockMovementEntity[] = [];
    const poRefId = `PO-${id16().slice(0, 6).toUpperCase()}`;

    // 1. Process items
    for (const item of draft.items) {
      let stock = stockItems.find(s => s.warehouse_id === item.warehouse_id && s.product_variant_id === item.product_variant_id);

      let targetStockId = '';
      if (!stock) {
        targetStockId = `si_${id16()}`;
        stock = {
          stock_item_id: targetStockId,
          product_variant_id: item.product_variant_id,
          warehouse_id: item.warehouse_id,
          quantity_on_hand: item.quantity,
          quantity_reserved: 0,
          reorder_point: DEFAULT_REORDER_POINT,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        stockItems.unshift(stock);
      } else {
        targetStockId = stock.stock_item_id;
        const updatedStock: StockItemEntity = {
          ...stock,
          quantity_on_hand: stock.quantity_on_hand + item.quantity,
          updated_at: new Date().toISOString()
        };
        stockItems = stockItems.map(s => s.stock_item_id === targetStockId ? updatedStock : s);
      }

      // 2. Add Stock Movement per item
      const mv: StockMovementEntity = {
        movement_id: `mv_${id16()}`,
        warehouse_id: item.warehouse_id,
        product_variant_id: item.product_variant_id,
        reference_type: 'purchase_order',
        reference_id: poRefId,
        quantity_changed: item.quantity,
        reason: draft.note || `Nhập hàng theo cấu trúc Đơn PO (Brand: ${draft.brand_id || 'N/A'})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newMovements.push(mv);
    }

    this.stockItems$.next(stockItems);
    this.movements$.next([...newMovements, ...this.movements$.value]);

    // 3. Clear draft and return to list
    this.importDraft$.next(null);
    this.goList();
  }

  addImportItem() {
    const draft = this.importDraft$.value;
    if (!draft) return;
    const { warehouse_id, product_variant_id, quantity, unit_cost } = draft.tempItem;
    if (!warehouse_id || !product_variant_id || quantity <= 0) return;

    const newItem: PurchaseOrderItemDraft = {
      id: `it_${id16()}`,
      product_variant_id,
      warehouse_id,
      quantity,
      unit_cost
    };

    this.importDraft$.next({
      ...draft,
      items: [newItem, ...draft.items],
      tempItem: { warehouse_id: '', product_variant_id: '', quantity: 1, unit_cost: 0 }
    });
  }

  removeImportItem(id: string) {
    const draft = this.importDraft$.value;
    if (!draft) return;
    this.importDraft$.next({
      ...draft,
      items: draft.items.filter(x => x.id !== id)
    });
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
        stt: 0,
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

  // ===== PO HELPER METHODS =====
  getPOIconClass(status: POStatus): string {
    switch (status) {
      case 'completed': return 'icon-ok';
      case 'confirmed':
      case 'receiving': return 'icon-blue';
      case 'pending': return 'icon-purple';
      case 'cancelled': return 'icon-muted';
      default: return 'icon-muted';
    }
  }

  getPOIcon(status: POStatus): string {
    switch (status) {
      case 'completed': return 'bi-check-circle-fill';
      case 'confirmed': return 'bi-clipboard-check';
      case 'receiving': return 'bi-truck';
      case 'pending': return 'bi-hourglass-split';
      case 'cancelled': return 'bi-x-circle';
      default: return 'bi-clipboard';
    }
  }

  getPOPillClass(status: POStatus): string {
    switch (status) {
      case 'completed': return 'pill-ok';
      case 'confirmed':
      case 'receiving': return 'pill-blue';
      case 'pending': return 'pill-purple';
      case 'cancelled': return 'pill-cancelled';
      default: return '';
    }
  }

  getPOStatusLabel(status: POStatus): string {
    switch (status) {
      case 'completed': return 'Hoàn tất';
      case 'confirmed': return 'Đã xác nhận';
      case 'receiving': return 'Đang nhận';
      case 'pending': return 'Chờ duyệt';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  }

  private syncRoute(id: string | null, mode: Mode) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        id: id ?? null,
        edit: id && mode === 'edit' ? 'true' : null,
        action: mode === 'create_po' ? 'create_po' : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private attemptLeave(action: () => void) {
    if (!this.isDirty) {
      action();
      return;
    }

    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
  }

  private seedAdjustDraft() {
    const draft: StockAdjustDraft = {
      targetWarehouseId: '',
      qtyAbs: 1,
      reason: '',
    };
    this.editModel$.next(draft);
    this.originalEditSnapshot = JSON.stringify(draft);
  }

  private clearEditState() {
    this.editModel$.next(null);
    this.originalEditSnapshot = null;
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
  return `${dd}/${mm}/${yyyy}`;
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

const MOCK_PO_LIST: POEntity[] = [
  {
    po_id: 'po_001',
    po_number: '#PO-0012',
    brand_id: 'br_001',
    brand_name: 'Nhà cung cấp Hòa Phát',
    note: 'Lô nhập quý 1/2026',
    status: 'completed',
    item_count: 5,
    total_cost: 48_000_000,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    po_id: 'po_002',
    po_number: '#PO-0018',
    brand_id: 'br_002',
    brand_name: 'Xưởng Mộc Ý Tưởng',
    note: 'Sofa bọc da cao cấp series',
    status: 'receiving',
    item_count: 3,
    total_cost: 27_500_000,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    po_id: 'po_003',
    po_number: '#PO-0021',
    brand_id: 'br_003',
    brand_name: 'Nhập khẩu Q-Home',
    note: 'PO cấp bù Low-stock SKU-002, SKU-004',
    status: 'confirmed',
    item_count: 2,
    total_cost: 15_600_000,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    po_id: 'po_004',
    po_number: '#PO-0023',
    brand_id: 'br_001',
    brand_name: 'Nhà cung cấp Hòa Phát',
    note: 'Bàn ăn gỗ sồi mẫu mới',
    status: 'pending',
    item_count: 4,
    total_cost: 32_200_000,
    created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    po_id: 'po_005',
    po_number: '#PO-0009',
    brand_id: 'br_002',
    brand_name: 'Xưởng Mộc Ý Tưởng',
    note: 'Đã hủy do nhà cung cấp không đủ hàng',
    status: 'cancelled',
    item_count: 1,
    total_cost: 8_800_000,
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
];