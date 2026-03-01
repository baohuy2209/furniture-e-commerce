import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type RangeMode = 'day' | 'week' | 'month';

/** MATCH management-orders */
type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'exchange_requested'
  | 'exchanged';

interface ORDER {
  order_id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string; // ISO
}

interface USER_MIN {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface ORDER_ITEM_MIN {
  order_item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
}

interface PRODUCT_MIN {
  product_id: string;
  product_name: string;
  image_url?: string;
}

interface REVIEW {
  review_id: string;
  user_id: string;
  product_id: string;
  rating: number; // 1..5
  comment: string;
  created_at: string; // ISO
}

function n(x: any, fallback = 0): number {
  const v = Number(x);
  return Number.isFinite(v) ? v : fallback;
}
function safeText(x: any): string {
  return (x ?? '').toString();
}
function isoDate(iso: string): string {
  return iso ? iso.slice(0, 10) : '';
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function formatVNDateTimeShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

/** SAFE UUID (avoid crypto.randomUUID runtime fail on some envs) */
function uuid(): string {
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();

  // fallback v4-ish
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

@Component({
  standalone: true,
  selector: 'general-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-dashboard.html',
  styleUrls: ['./general-dashboard.css'],
})
export class GeneralDashboard implements OnInit {
  rangeMode: RangeMode = 'day';

  /** date inputs (yyyy-MM-dd) */
  from_date = '';
  to_date = '';
  todayStr = isoDate(new Date().toISOString());

  // stores (local only)
  users: USER_MIN[] = [];
  orders: ORDER[] = [];
  orderItems: ORDER_ITEM_MIN[] = [];
  products: PRODUCT_MIN[] = [];
  reviews: REVIEW[] = [];

  ngOnInit(): void {
    this.applyPresetRange('day'); // start = today
    this.seedMockDomainData();
    void this.tryLoadProducts();
  }

  // ===== UI actions =====
  setRangeMode(m: RangeMode) {
    this.rangeMode = m;
    this.applyPresetRange(m);
  }

  resetFilters() {
    this.applyPresetRange(this.rangeMode);
  }

  /** preset theo rule */
  private applyPresetRange(m: RangeMode) {
    const today = new Date();
    let from = today;

    if (m === 'day') from = today;
    if (m === 'week') from = addDays(today, -7);
    if (m === 'month') from = addDays(today, -30);

    this.from_date = isoDate(from.toISOString());
    this.to_date = isoDate(today.toISOString());
    this.normalizeDateRange();
  }

  /** user changed from */
  onFromChange() {
    this.normalizeDateRange();
  }

  /** user changed to */
  onToChange() {
    this.normalizeDateRange();
  }

  /** enforce:
   * - from/to không vượt hôm nay
   * - to >= from
   */
  private normalizeDateRange() {
    const today = startOfDay(new Date()).getTime();

    let from = this.from_date ? startOfDay(new Date(this.from_date)).getTime() : today;
    let to = this.to_date ? startOfDay(new Date(this.to_date)).getTime() : today;

    if (Number.isNaN(from)) from = today;
    if (Number.isNaN(to)) to = today;

    if (from > today) from = today;
    if (to > today) to = today;

    if (to < from) to = from;

    this.from_date = isoDate(new Date(from).toISOString());
    this.to_date = isoDate(new Date(to).toISOString());
    this.todayStr = isoDate(new Date().toISOString());
  }

  // ===== computed =====
  get vm() {
    const from = this.from_date ? startOfDay(new Date(this.from_date)) : startOfDay(new Date());
    const to = this.to_date ? endOfDay(new Date(this.to_date)) : endOfDay(new Date());

    const inRange = this.orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= from.getTime() && t <= to.getTime();
    });

    // revenue: exclude cancelled
    const revenue = inRange
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + n(o.total_amount), 0);

    const totalOrders = inRange.length;

    // "đơn đang xử lý": pending/packed/shipping/return_requested/exchange_requested
    const activeOrders = inRange.filter((o) =>
      ['pending', 'packed', 'shipping', 'return_requested', 'exchange_requested'].includes(
        o.status,
      ),
    ).length;

    // customers: unique user in all orders
    const customers = new Set(this.orders.map((o) => o.user_id)).size;

    // status distribution
    const statusCount: Record<OrderStatus, number> = {
      pending: 0,
      packed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      return_requested: 0,
      returned: 0,
      exchange_requested: 0,
      exchanged: 0,
    };
    for (const o of inRange) statusCount[o.status]++;

    const donut = this.buildDonut(statusCount);

    // recent orders: 5
    const recent = [...inRange]
      .sort((a, b) => safeText(b.created_at).localeCompare(safeText(a.created_at)))
      .slice(0, 5)
      .map((o) => {
        const u = this.users.find((x) => x.user_id === o.user_id);
        return {
          ...o,
          customer_name: u ? `${u.first_name} ${u.last_name}`.trim() : '(unknown)',
          customer_phone: u?.phone ?? '',
        };
      });

    // top products by quantity in-range
    const orderIds = new Set(inRange.map((o) => o.order_id));
    const itemsInRange = this.orderItems.filter((it) => orderIds.has(it.order_id));

    const qtyByProduct = new Map<string, number>();
    for (const it of itemsInRange) {
      qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id) ?? 0) + n(it.quantity, 0));
    }

    const topProducts = [...qtyByProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([product_id, qty]) => {
        const p = this.products.find((x) => x.product_id === product_id);
        return {
          product_id,
          product_name: p?.product_name ?? `Product ${product_id}`,
          image_url: p?.image_url ?? '',
          qty,
        };
      });

    // recent reviews: 5 latest
    const recentReviews = [...this.reviews]
      .sort((a, b) => safeText(b.created_at).localeCompare(safeText(a.created_at)))
      .slice(0, 5)
      .map((r) => {
        const u = this.users.find((x) => x.user_id === r.user_id);
        const p = this.products.find((x) => x.product_id === r.product_id);
        return {
          ...r,
          customer_name: u ? `${u.first_name} ${u.last_name}`.trim() : '(unknown)',
          product_name: p?.product_name ?? `Product ${r.product_id}`,
        };
      });

    // series for chart
    const series = this.buildSeries(inRange, from, to, this.rangeMode);

    return {
      from,
      to,
      revenue,
      totalOrders,
      activeOrders,
      customers,
      statusCount,
      donut,
      recent,
      topProducts,
      recentReviews,
      series,
    };
  }

  // ===== chart builders =====
  private buildSeries(orders: ORDER[], from: Date, to: Date, mode: RangeMode) {
    type Bucket = { key: string; label: string; revenue: number; orders: number };
    const buckets: Bucket[] = [];

    if (mode === 'day') {
      // show 7 days ending today
      const end = startOfDay(new Date(this.to_date || new Date().toISOString()));
      const start = addDays(end, -6);
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        const k = isoDate(d.toISOString());
        buckets.push({ key: k, label: k.slice(5), revenue: 0, orders: 0 });
      }
    } else if (mode === 'week') {
      // show 8 weeks
      const count = 8;
      const end = startOfDay(new Date(this.to_date || new Date().toISOString()));
      for (let i = count - 1; i >= 0; i--) {
        const wEnd = addDays(end, -7 * i);
        const wStart = addDays(wEnd, -6);
        const key = `${isoDate(wStart.toISOString())}_${isoDate(wEnd.toISOString())}`;
        buckets.push({
          key,
          label: `${String(wStart.getDate()).padStart(2, '0')}/${String(
            wStart.getMonth() + 1,
          ).padStart(2, '0')}`,
          revenue: 0,
          orders: 0,
        });
      }
    } else {
      // show 6 months
      const count = 6;
      const end = new Date(this.to_date || new Date().toISOString());
      const y0 = end.getFullYear();
      const m0 = end.getMonth();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(y0, m0 - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label: key, revenue: 0, orders: 0 });
      }
    }

    for (const o of orders) {
      const t = new Date(o.created_at);
      if (t < from || t > to) continue;

      let bucketKey = '';
      if (mode === 'day') {
        bucketKey = isoDate(t.toISOString());
      } else if (mode === 'week') {
        for (const b of buckets) {
          const [s, e] = b.key.split('_');
          if (!s || !e) continue;
          const st = startOfDay(new Date(s));
          const en = endOfDay(new Date(e));
          if (t >= st && t <= en) {
            bucketKey = b.key;
            break;
          }
        }
      } else {
        bucketKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
      }

      const b = buckets.find((x) => x.key === bucketKey);
      if (!b) continue;

      b.orders += 1;
      if (o.status !== 'cancelled') b.revenue += n(o.total_amount, 0);
    }

    const revMax = Math.max(1, ...buckets.map((b) => b.revenue));
    const ordMax = Math.max(1, ...buckets.map((b) => b.orders));

    const width = 820;
    const height = 220;
    const padX = 18;
    const padY = 18;

    const xStep = buckets.length > 1 ? (width - padX * 2) / (buckets.length - 1) : 1;

    const revPoints = buckets
      .map((b, i) => {
        const x = padX + i * xStep;
        const y = padY + (height - padY * 2) * (1 - b.revenue / revMax);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const ordPoints = buckets
      .map((b, i) => {
        const x = padX + i * xStep;
        const y = padY + (height - padY * 2) * (1 - b.orders / ordMax);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return {
      buckets,
      svg: { width, height, revPoints, ordPoints, revMax, ordMax },
    };
  }

  private buildDonut(statusCount: Record<OrderStatus, number>) {
    const total = Object.values(statusCount).reduce((a, b) => a + b, 0) || 1;

    const parts = [
      { key: 'delivered', label: 'Đã giao', value: statusCount.delivered },
      { key: 'shipping', label: 'Đang giao', value: statusCount.shipping },
      { key: 'packed', label: 'Đã xác nhận', value: statusCount.packed },
      { key: 'pending', label: 'Chờ xác nhận', value: statusCount.pending },
      { key: 'cancelled', label: 'Đã huỷ', value: statusCount.cancelled },
      { key: 'return_requested', label: 'Y/c trả hàng', value: statusCount.return_requested },
      { key: 'exchange_requested', label: 'Y/c đổi hàng', value: statusCount.exchange_requested },
    ] as const satisfies ReadonlyArray<{ key: OrderStatus; label: string; value: number }>;

    const filtered = parts.filter((p) => p.value > 0);

    const r = 64;
    const c = 2 * Math.PI * r;

    let offset = 0;
    const segments = parts.map((p) => {
      const frac = p.value / total;
      const len = frac * c;
      const seg = { ...p, dash: `${len} ${c - len}`, offset };
      offset += len;
      return seg;
    });

    return { total, r, c, segments };
  }

  // ===== seed & load =====
  private seedMockDomainData() {
    if (this.orders.length) return;

    this.users = [
      { user_id: 'u_01', first_name: 'Lê Thị', last_name: 'Duy Nhất', phone: '0987654321' },
      { user_id: 'u_02', first_name: 'Nguyễn', last_name: 'Khánh Xuân', phone: '0778889900' },
      { user_id: 'u_03', first_name: 'Nguyễn', last_name: 'Minh Quân', phone: '0901234567' },
      { user_id: 'u_04', first_name: 'Võ Hồng', last_name: 'Phúc', phone: '0335557799' },
      { user_id: 'u_05', first_name: 'Đặng Thị', last_name: 'Lan', phone: '0886665544' },
      { user_id: 'u_06', first_name: 'Phan Thị', last_name: 'Ánh Linh', phone: '0912345678' },
      { user_id: 'u_07', first_name: 'Đỗ Gia', last_name: 'Bảo', phone: '0765432109' },
      { user_id: 'u_08', first_name: 'Nguyễn', last_name: 'Quang Phúc', phone: '0934567890' },
      { user_id: 'u_09', first_name: 'Trần', last_name: 'Thanh', phone: '0909991111' },
      { user_id: 'u_10', first_name: 'Phạm', last_name: 'Hà', phone: '0902223333' },
    ];

    const now = new Date();
    const ago = (d: number, h = 0) => {
      const x = new Date(now);
      x.setDate(x.getDate() - d);
      x.setHours(x.getHours() - h);
      return x.toISOString();
    };

    const statuses: OrderStatus[] = [
      'delivered',
      'shipping',
      'packed',
      'pending',
      'cancelled',
      'return_requested',
      'exchange_requested',
      'returned',
      'exchanged',
    ];

    const rndAmount = () => {
      const base = [180000, 300000, 420000, 459000, 700000, 945000, 1224000, 21780000];
      return base[Math.floor(Math.random() * base.length)];
    };

    this.orders = Array.from({ length: 49 }).map((_, i) => {
      const st = statuses[i % statuses.length];
      const t = ago(Math.floor(Math.random() * 38), Math.floor(Math.random() * 18));
      const isCancel = st === 'cancelled';
      return {
        order_id: uuid(),
        order_number: `ORD-${String(40 + i).padStart(4, '0')}`,
        user_id: this.users[i % this.users.length].user_id,
        status: st,
        total_amount: isCancel ? 0 : rndAmount(),
        created_at: t,
      };
    });

    const productIds = ['p_01', 'p_02', 'p_03', 'p_04', 'p_05', 'p_06', 'p_07', 'p_08'];
    this.orderItems = [];
    for (const o of this.orders) {
      const items = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < items; k++) {
        this.orderItems.push({
          order_item_id: uuid(),
          order_id: o.order_id,
          product_id: productIds[Math.floor(Math.random() * productIds.length)],
          quantity: 1 + Math.floor(Math.random() * 3),
        });
      }
    }

    this.products = productIds.map((id, i) => ({
      product_id: id,
      product_name: `Sản phẩm #${i + 1}`,
      image_url: '',
    }));

    const sampleComments = [
      'Giao nhanh, đóng gói kỹ.',
      'Chất lượng ổn trong tầm giá.',
      'Màu giống hình, rất hài lòng.',
      'Lắp ráp hơi lâu nhưng ok.',
      'Nhân viên hỗ trợ nhiệt tình.',
      'Sản phẩm đẹp, chắc chắn.',
    ];
    this.reviews = Array.from({ length: 24 }).map((_, i) => ({
      review_id: uuid(),
      user_id: this.users[i % this.users.length].user_id,
      product_id: productIds[i % productIds.length],
      rating: 3 + (i % 3), // 3..5
      comment: sampleComments[i % sampleComments.length],
      created_at: ago(Math.floor(Math.random() * 20), Math.floor(Math.random() * 22)),
    }));
  }

  private async tryLoadProducts() {
    const loaded = await this.tryLoadJson<any[]>('/assets/data/product.json', []);
    if (!loaded.length) return;

    const norm: PRODUCT_MIN[] = loaded
      .map((p: any) => ({
        product_id: safeText(p.product_id),
        product_name: safeText(p.product_name),
        image_url: safeText(p.image_url || p.thumbnail_url || ''),
      }))
      .filter((p) => !!p.product_id);

    if (norm.length) {
      this.products = norm;

      const ids = this.products.slice(0, 12).map((p) => p.product_id);
      if (ids.length) {
        this.orderItems = this.orderItems.map((it) => ({
          ...it,
          product_id: ids[Math.floor(Math.random() * ids.length)],
        }));
        this.reviews = this.reviews.map((r) => ({
          ...r,
          product_id: ids[Math.floor(Math.random() * ids.length)],
        }));
      }
    }
  }

  private async tryLoadJson<T>(url: string, fallback: T): Promise<T> {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }

  // ===== labels (MATCH management-orders) =====
  statusLabel(s: OrderStatus) {
    switch (s) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'packed':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã huỷ';
      case 'return_requested':
        return 'Y/c trả hàng';
      case 'returned':
        return 'Đã trả hàng';
      case 'exchange_requested':
        return 'Y/c đổi hàng';
      case 'exchanged':
        return 'Đã đổi hàng';
      default:
        return s;
    }
  }

  statusPillClass(s: OrderStatus) {
    switch (s) {
      case 'pending':
        return 'pill-pending';
      case 'packed':
        return 'pill-packed';
      case 'shipping':
        return 'pill-shipping';
      case 'delivered':
        return 'pill-delivered';
      case 'cancelled':
        return 'pill-cancelled';
      case 'return_requested':
        return 'pill-warn';
      case 'exchange_requested':
        return 'pill-info';
      case 'returned':
        return 'pill-delivered';
      case 'exchanged':
        return 'pill-delivered';
      default:
        return '';
    }
  }

  fmtVND(x: number) {
    return `${n(x).toLocaleString('vi-VN')}đ`;
  }

  fmtDateTime(iso: string) {
    return formatVNDateTimeShort(iso);
  }

  stars(nStar: number) {
    const k = Math.max(0, Math.min(5, Math.floor(n(nStar, 0))));
    return '★'.repeat(k) + '☆'.repeat(5 - k);
  }
}
