import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, combineLatest, map, lastValueFrom, forkJoin, catchError, of } from 'rxjs';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

type SortDir = 'asc' | 'desc';
type ReferenceType = 'purchase_order' | 'customer_order' | 'transfer' | 'adjustment';
type AdjustType = 'IN' | 'OUT' | 'ADJUST';
type POStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

type StockSortKey =
  | 'product_variant_id'
  | 'sku'
  | 'warehouse'
  | 'status'
  | 'quantity_on_hand'
  | 'updated_at';

interface WarehouseEntity {
  _id: string;
  name: string;
  address_warehouse: string;
  warehouse_area: string;
  warehouse_status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ProductVariantMin {
  _id: string;
  product?: any;
  sku: string;
  price: number;
  num_inventory?: number;
  num_selled?: number;
}

interface BrandEntity {
  _id: string;
  brand_name?: string;
  name?: string;
}

interface POEntity {
  _id: string;
  po_number: string;
  brand_id: any;
  status: POStatus;
  items: any[];
  total_amount: number;
  createdAt: string;
  note: string;
}

interface StockItemEntity {
  _id: string;
  product_variant_id: any;
  warehouse_id: any;
  quantity_on_hand: number;
  quantity_reserved: number;
  updatedAt: string;
}

interface StockMovementEntity {
  _id: string;
  warehouse_id: any;
  product_id: any;
  reference_id: string;
  reference_type: ReferenceType;
  quantity_change: number;
  reason: string;
  createdAt: string;
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

interface POListItemVM {
  po_id: string;
  po_number: string;
  brand_name: string;
  status: POStatus;
  itemCount: number;
  totalCostText: string;
  createdAtText: string;
  note: string;
}

const DEFAULT_REORDER_POINT = 5;

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
  importPreviewList: any[];
  importTotalCost: number;
  brands: BrandEntity[];
  currentPanel: 'detail' | 'adjust' | 'import' | null;
  poList: POListItemVM[];
  transferList: MovementRowVM[];
  variants: ProductVariantMin[];
}

@Component({
  selector: 'app-management-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModal, RouterModule],
  providers: [DecimalPipe],
  templateUrl: './management-warehouse.html',
  styleUrls: ['./management-warehouse.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementWarehouse implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  private warehouses$ = new BehaviorSubject<WarehouseEntity[]>([]);
  private variants$ = new BehaviorSubject<ProductVariantMin[]>([]);
  private stockItems$ = new BehaviorSubject<StockItemEntity[]>([]);
  private movements$ = new BehaviorSubject<StockMovementEntity[]>([]);
  private poItems$ = new BehaviorSubject<POEntity[]>([]);
  private brands$ = new BehaviorSubject<BrandEntity[]>([]);

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

      this.routeState$.next({ id, edit, createPO });

      if (createPO) {
        this.clearEditState();
        if (!this.importDraft$.value) {
          const d: PurchaseOrderDraft = {
            brand_id: '',
            note: '',
            tempItem: { warehouse_id: '', product_variant_id: '', quantity: 1, unit_cost: 0 },
            items: []
          };
          this.importDraft$.next(d);
          this.originalEditSnapshot = JSON.stringify(d);
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

    this.loadData();
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
    this.brands$,
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
        brands,
      ]) => {
        const { id: selectedId, edit, createPO } = routeState;
        const mode: Mode = createPO ? 'create_po' : !selectedId ? 'list' : edit ? 'edit' : 'detail';

        const variantMap = new Map<string, ProductVariantMin>(variants.map(v => [v._id, v]));
        const whMap = new Map<string, WarehouseEntity>(warehouses.map(w => [w._id, w]));

        const baseStock: StockRowVM[] = stockItems.map((si) => {
          const vId = si.product_variant_id?._id || si.product_variant_id;
          const wId = si.warehouse_id?._id || si.warehouse_id;
          const v = variantMap.get(vId) ?? null;
          const w = whMap.get(wId) ?? null;

          const reorder = DEFAULT_REORDER_POINT;
          const low = si.quantity_on_hand < reorder;

          return {
            stock_item_id: si._id,
            product_variant_id: vId,
            sku: v?.sku || 'N/A',
            product_id: v?.product?._id || 'N/A',
            warehouse_id: wId,
            warehouse_name: w?.name || wId,
            quantity_on_hand: si.quantity_on_hand,
            reorder_point: reorder,
            low_stock: low,
            updated_at: si.updatedAt,
            updatedAtText: fmtDate(si.updatedAt),
            qtyText: String(si.quantity_on_hand),
            statusLabel: low ? 'Low stock' : 'Ổn định',
            statusPillClass: low ? 'pill-warn' : 'pill-ok',
            stt: 0,
          };
        });

        const summary: SummaryVM = {
          totalSkus: baseStock.length,
          lowStockCount: baseStock.filter(x => x.low_stock).length,
          totalOnHandValueText: money(baseStock.reduce((acc, r) => acc + (r.quantity_on_hand * (variantMap.get(r.product_variant_id)?.price || 0)), 0))
        };

        const key = q.trim().toLowerCase();
        let filtered = baseStock
          .filter(r => (whId ? r.warehouse_id === whId : true))
          .filter(r => (lowOnly ? r.low_stock : true))
          .filter(r => !key || `${r.sku} ${r.product_id} ${r.warehouse_name}`.toLowerCase().includes(key));

        filtered.sort((a, b) => {
          const dir = sortDirStock === 'asc' ? 1 : -1;
          const av = getStockSortValue(a, sortKeyStock);
          const bv = getStockSortValue(b, sortKeyStock);
          return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
        });

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const to = Math.min(total, safePage * pageSize);

        const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((r, i) => ({
          ...r,
          stt: (safePage - 1) * pageSize + i + 1,
        }));

        let detailVM: StockDetailVM | null = null;
        if (selectedId) {
          const s = stockItems.find(x => x._id === selectedId);
          if (s) {
            const vId = s.product_variant_id?._id || s.product_variant_id;
            const wId = s.warehouse_id?._id || s.warehouse_id;
            const recent = movements
              .filter(m => (m.product_id?._id || m.product_id) === vId && (m.warehouse_id?._id || m.warehouse_id) === wId)
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 10)
              .map(movementToVM);

            detailVM = {
              stock: s,
              warehouse: whMap.get(wId) || null,
              variant: variantMap.get(vId) || null,
              statusLabel: s.quantity_on_hand < DEFAULT_REORDER_POINT ? 'Low stock' : 'Ổn định',
              statusPillClass: s.quantity_on_hand < DEFAULT_REORDER_POINT  ? 'pill-warn' : 'pill-ok',
              onHandText: String(s.quantity_on_hand),
              updatedAtText: fmtDate(s.updatedAt),
              recentMovements: recent,
            };
          }
        }

        let importPreviewList = [];
        let importTotalCost = 0;
        if (createPO && importDraft) {
          for (const it of importDraft.items) {
            const v = variantMap.get(it.product_variant_id);
            const cur = baseStock.find(s => s.product_variant_id === it.product_variant_id && s.warehouse_id === it.warehouse_id)?.quantity_on_hand || 0;
            importTotalCost += it.quantity * it.unit_cost;
            importPreviewList.push({
              id: it.id,
              sku: v?.sku || it.product_variant_id,
              warehouseName: whMap.get(it.warehouse_id)?.name || it.warehouse_id,
              currentStock: cur,
              expectedStock: cur + it.quantity,
              quantity: it.quantity,
              unit_cost: it.unit_cost,
              subtotal: it.quantity * it.unit_cost
            });
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
          importDraft,
          importStep,
          importPreviewList,
          importTotalCost,
          brands,
          currentPanel: createPO ? 'import' : !selectedId ? null : edit ? 'adjust' : 'detail',
          poList: poItems.map((po: any) => {
             // Backend already transformed this list in getAllPurchaseOrders
             return {
                po_id: po.po_id || po._id,
                po_number: po.po_number || 'N/A',
                brand_name: po.brand_name || 'N/A',
                status: po.status as POStatus,
                itemCount: po.item_count || 0,
                totalCostText: money(po.total_cost || 0),
                createdAtText: fmtDate(po.created_at || po.createdAt),
                note: po.note || ''
             };
          }),
          transferList: movements.filter(m => m.reference_type === 'adjustment').map(movementToVM),
          variants,
        };
        return vm;
      },
    ),
  );

  onChangeQ(v: string) { this.q = v; this.q$.next(v); this.setPage(1); }
  onChangeWarehouse(v: string) { this.f_warehouse_id = v; this.wh$.next(v); this.setPage(1); }
  onToggleLowOnly(v: boolean) { this.f_low_only = !!v; this.lowOnly$.next(!!v); this.setPage(1); }
  onChangePageSize(v: number) { this.pageSize = Number(v); this.pageSize$.next(this.pageSize); this.setPage(1); }
  resetFilters() {
    this.q = ''; this.f_warehouse_id = ''; this.f_low_only = false;
    this.q$.next(''); this.wh$.next(''); this.lowOnly$.next(false);
    this.sortKeyStock$.next('updated_at'); this.sortDirStock$.next('desc');
    this.setPage(1);
  }
  toggleSortStock(key: StockSortKey) {
    if (this.sortKeyStock$.value === key) {
      this.sortDirStock$.next(this.sortDirStock$.value === 'asc' ? 'desc' : 'asc');
    } else { this.sortKeyStock$.next(key); this.sortDirStock$.next('asc'); }
  }
  setPage(p: number) { this.page = p; this.page$.next(p); }
  openDetail(id: string) { this.syncRoute(id, 'detail'); }
  openAdjust(id: string) { this.syncRoute(id, 'edit'); }
  openCreatePO() { this.importStep$.next(1); this.syncRoute(null, 'create_po'); }
  cancelCreatePO() { this.goList(); }
  goList() { this.attemptLeave(() => this.syncRoute(null, 'list')); }
  enterEdit() { const id = this.routeState$.value.id; if (id) this.syncRoute(id, 'edit'); }
  onHeaderBack() {
    const s = this.routeState$.value;
    if (s.id && s.edit) { this.backToDetail(); return; }
    this.goList();
  }
  backToDetail() { const id = this.routeState$.value.id; if (id) this.syncRoute(id, 'detail'); }
  updateAdjustTarget(wid: string) { if (this.editModel$.value) this.editModel$.next({ ...this.editModel$.value, targetWarehouseId: wid }); }
  updateAdjustQty(v: number) { if (this.editModel$.value) this.editModel$.next({ ...this.editModel$.value, qtyAbs: Number(v) }); }
  updateAdjustReason(v: string) { if (this.editModel$.value) this.editModel$.next({ ...this.editModel$.value, reason: v }); }
  get isDirty() {
    if (this.editModel$.value) return JSON.stringify(this.editModel$.value) !== this.originalEditSnapshot;
    if (this.importDraft$.value) return JSON.stringify(this.importDraft$.value) !== this.originalEditSnapshot;
    return false;
  }
  onConfirmDiscard() {
    this.discardModalOpen = false;
    const action = this.pendingDiscardAction;
    this.pendingDiscardAction = null;
    this.clearEditState();
    action?.();
  }
  onCancelDiscard() { this.discardModalOpen = false; this.pendingDiscardAction = null; }
  onCancelSave() { this.saveModalOpen = false; }

  async saveEdit() {
    const draft = this.editModel$.value;
    const id = this.routeState$.value.id;
    if (!draft || !id) return;
    const target = this.stockItems$.value.find(s => s._id === id);
    if (!target) return;
    const payload = {
      warehouse_id: target.warehouse_id?._id || target.warehouse_id,
      product_id: target.product_variant_id?._id || target.product_variant_id,
      quantity_change: draft.qtyAbs, 
      reason: draft.reason || 'Điều chỉnh thủ công',
      reference_type: 'adjustment'
    };
    try {
      await lastValueFrom(this.http.post(`${environment.backend_url}/stock-movements`, payload, { withCredentials: true }));
      this.loadData();
      this.goList();
    } catch (err) { alert('Lỗi khi điều chỉnh kho'); }
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
    const variantMap = new Map<string, ProductVariantMin>(variants.map(v => [v._id, v]));
    const whMap = new Map<string, WarehouseEntity>(warehouses.map(w => [w._id, w]));
    return stockItems.map((si) => {
      const vId = si.product_variant_id?._id || si.product_variant_id;
      const wId = si.warehouse_id?._id || si.warehouse_id;
      const v = variantMap.get(vId) ?? null;
      const w = whMap.get(wId) ?? null;
      const low = si.quantity_on_hand < DEFAULT_REORDER_POINT;
      return {
        stock_item_id: si._id,
        product_variant_id: vId,
        sku: v?.sku || 'N/A',
        product_id: v?.product?._id || 'N/A',
        warehouse_id: wId,
        warehouse_name: w?.name || wId,
        quantity_on_hand: si.quantity_on_hand,
        reorder_point: DEFAULT_REORDER_POINT,
        low_stock: low,
        updated_at: si.updatedAt,
        updatedAtText: fmtDate(si.updatedAt),
        qtyText: String(si.quantity_on_hand),
        statusLabel: low ? 'Low stock' : 'Ổn định',
        statusPillClass: low ? 'pill-warn' : 'pill-ok',
        stt: 0,
      };
    });
  }

  async executeSave() {
    this.saveEdit();
  }

  async executePO() {
    const draft = this.importDraft$.value;
    if (!draft || !draft.brand_id || draft.items.length === 0) return;
    const payload = {
      brand_id: draft.brand_id,
      note: draft.note,
      items: draft.items.map(it => ({
        product_variant_id: it.product_variant_id,
        warehouse_id: it.warehouse_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        sku: this.variants$.value.find(v => v._id === it.product_variant_id)?.sku || ''
      }))
    };
    try {
      const res: any = await lastValueFrom(this.http.post(`${environment.backend_url}/admin/purchase-orders`, payload, { withCredentials: true }));
      if (res && res.data && res.data._id) {
        await lastValueFrom(this.http.patch(`${environment.backend_url}/admin/purchase-orders/${res.data._id}/status`, { status: 'received' }, { withCredentials: true }));
      }
      alert('Tạo phiếu nhập hàng và nhập kho thành công!');
      this.loadData();
      this.clearEditState();
      this.syncRoute(null, 'list');
    } catch (err) { 
      console.error(err);
      alert('Lỗi khi tạo PO'); 
    }
  }
  addImportItem() {
    const draft = this.importDraft$.value;
    if (!draft) return;
    const { warehouse_id, product_variant_id, quantity, unit_cost } = draft.tempItem;
    if (!warehouse_id || !product_variant_id || quantity <= 0) return;
    const newItem = { id: id16(), product_variant_id, warehouse_id, quantity, unit_cost };
    this.importDraft$.next({ ...draft, items: [newItem, ...draft.items], tempItem: { ...draft.tempItem, product_variant_id: '', quantity: 1 } });
  }
  removeImportItem(id: string) {
    const draft = this.importDraft$.value;
    if (draft) this.importDraft$.next({ ...draft, items: draft.items.filter(x => x.id !== id) });
  }
  nextImportStep() { this.importStep$.next(2); }
  prevImportStep() { this.importStep$.next(1); }
  loadData(): void {
    const api = environment.backend_url;
    const opts = { withCredentials: true };
    forkJoin({
      wh: this.http.get<any>(`${api}/warehouse`, opts).pipe(catchError(() => of({ data: [] }))),
      si: this.http.get<any>(`${api}/stock-items`, opts).pipe(catchError(() => of({ data: [] }))),
      mv: this.http.get<any>(`${api}/stock-movements`, opts).pipe(catchError(() => of({ data: [] }))),
      po: this.http.get<any>(`${api}/admin/purchase-orders`, opts).pipe(catchError(() => of({ data: [] }))),
      pv: this.http.get<any>(`${api}/product-variant`, opts).pipe(catchError(() => of({ data: [] }))),
      br: this.http.get<any>(`${api}/brands`, opts).pipe(catchError(() => of({ data: [] })))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.warehouses$.next(res.wh.data || []);
        this.stockItems$.next(res.si.data || []);
        this.movements$.next(res.mv.data || []);
        this.poItems$.next(res.po.data || []);
        this.variants$.next(res.pv.data || []);
        this.brands$.next(res.br.data || []);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Warehouse loadData error:', err);
        //alert('Lỗi khi tải dữ liệu kho. Vui lòng kiểm tra console.');
      }
    });
  }
  getPOIconClass(s: POStatus) {
    return s === 'received' ? 'icon-ok' : s === 'ordered' ? 'icon-blue' : s === 'draft' ? 'icon-purple' : 'icon-muted';
  }
  getPOIcon(s: POStatus) {
    return s === 'received' ? 'bi-check-circle-fill' : s === 'ordered' ? 'bi-truck' : s === 'draft' ? 'bi-hourglass-split' : 'bi-x-circle';
  }
  getPOPillClass(s: POStatus) {
    return s === 'received' ? 'pill-ok' : s === 'ordered' ? 'pill-blue' : s === 'draft' ? 'pill-purple' : 'pill-cancelled';
  }
  getPOStatusLabel(s: POStatus) {
    return s === 'received' ? 'Hoàn tất' : s === 'ordered' ? 'Đang xử lý' : s === 'draft' ? 'Nháp' : 'Đã hủy';
  }
  private syncRoute(id: string | null, mode: Mode) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id, edit: mode === 'edit' ? 'true' : null, action: mode === 'create_po' ? 'create_po' : null },
      queryParamsHandling: 'merge'
    });
  }
  private attemptLeave(action: () => void) {
    if (!this.isDirty) { action(); return; }
    this.pendingDiscardAction = action;
    this.discardModalOpen = true;
    this.cdr.markForCheck();
  }
  private seedAdjustDraft() {
    const draft = { targetWarehouseId: '', qtyAbs: 1, reason: '' };
    this.editModel$.next(draft);
    this.originalEditSnapshot = JSON.stringify(draft);
  }
  private clearEditState() {
    this.editModel$.next(null);
    this.originalEditSnapshot = null;
    this.importDraft$.next(null);
  }
  stopEvent(e: MouseEvent) { e.preventDefault(); e.stopPropagation(); }
}

function getStockSortValue(r: StockRowVM, key: StockSortKey): any {
  switch (key) {
    case 'product_variant_id': return r.product_variant_id.toLowerCase();
    case 'sku': return r.sku.toLowerCase();
    case 'warehouse': return r.warehouse_name.toLowerCase();
    case 'status': return r.low_stock ? 0 : 1;
    case 'quantity_on_hand': return r.quantity_on_hand;
    case 'updated_at': return +new Date(r.updated_at);
  }
}
function movementToVM(m: StockMovementEntity): MovementRowVM {
  return {
    movement_id: m._id,
    createdAtText: fmtDate(m.createdAt),
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    signText: m.quantity_change >= 0 ? 'IN' : 'OUT',
    qtyText: String(Math.abs(m.quantity_change)),
    reason: m.reason,
  };
}
function safeText(v: any) { return typeof v === 'string' ? v : v == null ? '' : String(v); }
function fmtDate(iso: string) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function money(v: number) { return Math.round(v).toLocaleString('vi-VN') + ' đ'; }
function id16() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function csvEsc(v: any) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}