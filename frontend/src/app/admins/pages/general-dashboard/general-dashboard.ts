import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderServices } from '../../../services/order-services';
import { UserService } from '../../../services/user-service';
import {
  IListProducts,
  IOrder,
  IOrderAdmin,
  IOrderItem,
  IOrderItemShipping,
  IPayment,
  IReview,
  IUser,
} from '../../../../interface';
import { ToastService } from '../../../services/toast-service';
import { Product } from '../../../services/product';
import { ReviewService } from '../../../services/review-service';

type RangeMode = 'day' | 'week' | 'month';

/** MATCH management-orders */
type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'exchange_requested'
  | 'exchanged';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './general-dashboard.html',
  styleUrls: ['./general-dashboard.css'],
})
export class GeneralDashboard implements OnInit {
  error: string = '';
  constructor(
    private orderService: OrderServices,
    private userService: UserService,
    private productService: Product,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {}
  // Global filter – affects KPIs and all tables
  activePreset: number | null = 30;
  g_from_date = '';
  g_to_date = '';

  todayStr = isoDate(new Date().toISOString());

  // stores (local only)
  users: IUser[] = [];
  orders: IOrderAdmin[] = [];
  orderItems: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[] = [];
  products: IListProducts[] = [];
  reviews: (Omit<IReview, 'user_id'> & {
    user_id: { _id: string; email: string };
    product_id: { _id: string; product_name: string };
  })[] = [];

  // Interactive Chart State
  hoveredBucket: any = null;
  hoveredX = 0;

  ngOnInit(): void {
    this.applyGlobalPreset(30);
    this.loadData();
  }

  onChartMouseMove(e: MouseEvent, svg: any) {
    const v = this.vm;
    const series = v.series;
    if (!series || !series.buckets.length) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Convert mouse X to SVG coordinate system (width: 820)
    const svgX = (x / rect.width) * series.svg.width;

    const padX = 18;
    const xStep =
      series.buckets.length > 1 ? (series.svg.width - padX * 2) / (series.buckets.length - 1) : 1;

    // Smooth X following
    this.hoveredX = Math.max(padX, Math.min(series.svg.width - padX, svgX));

    // Calculate interpolation index and fraction
    const rawIdx = (svgX - padX) / xStep;
    const i1 = Math.floor(rawIdx);
    const i2 = Math.ceil(rawIdx);

    if (i1 < 0) {
      this.hoveredBucket = {
        ...series.buckets[0],
        smoothedRev: series.buckets[0].revenue,
        smoothedOrd: series.buckets[0].orders,
      };
    } else if (i2 >= series.buckets.length) {
      const b = series.buckets[series.buckets.length - 1];
      this.hoveredBucket = { ...b, smoothedRev: b.revenue, smoothedOrd: b.orders };
    } else if (i1 === i2) {
      const b = series.buckets[i1];
      this.hoveredBucket = { ...b, smoothedRev: b.revenue, smoothedOrd: b.orders };
    } else {
      const b1 = series.buckets[i1];
      const b2 = series.buckets[i2];
      const t = rawIdx - i1; // fraction [0..1]

      const smoothedRev = b1.revenue + t * (b2.revenue - b1.revenue);
      const smoothedOrd = b1.orders + t * (b2.orders - b1.orders);

      // Use the nearest bucket for the label, but smoothed values for display
      const base = t > 0.5 ? b2 : b1;
      this.hoveredBucket = { ...base, smoothedRev, smoothedOrd };
    }
  }

  onChartMouseLeave() {
    this.hoveredBucket = null;
  }

  private initGlobalDates() {
    const d = new Date();
    this.g_to_date = isoDate(d.toISOString());
    const start = addDays(d, -30);
    this.g_from_date = isoDate(start.toISOString());
  }

  // ===== UI actions =====

  resetGlobalFilters() {
    this.applyGlobalPreset(30);
  }

  applyGlobalPreset(days: number) {
    this.activePreset = days;
    const today = new Date();
    this.g_to_date = isoDate(today.toISOString());
    const start = addDays(today, -(days - 1));
    this.g_from_date = isoDate(start.toISOString());
    this.normalizeGlobalDates();
  }

  isGlobalPresetActive(days: number): boolean {
    return this.activePreset === days;
  }

  onGlobalDateChange() {
    this.activePreset = null; // Clear preset since user changed dates manually
    this.normalizeGlobalDates();
  }

  private normalizeGlobalDates() {
    const today = startOfDay(new Date()).getTime();
    let from = this.g_from_date ? startOfDay(new Date(this.g_from_date)).getTime() : today;
    let to = this.g_to_date ? startOfDay(new Date(this.g_to_date)).getTime() : today;

    if (from > today) from = today;
    if (to > today) to = today;
    if (to < from) to = from;

    this.g_from_date = isoDate(new Date(from).toISOString());
    this.g_to_date = isoDate(new Date(to).toISOString());
  }

  // ===== computed =====
  get vm() {
    // GLOBAL RANGE
    const gFrom = this.g_from_date
      ? startOfDay(new Date(this.g_from_date))
      : startOfDay(new Date());
    const gTo = this.g_to_date ? endOfDay(new Date(this.g_to_date)) : endOfDay(new Date());

    // Filtered data for KPIs and Tables
    const ordersInRange = this.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= gFrom.getTime() && t <= gTo.getTime();
    });
    const ordersItemInRange = this.orderItems.filter((o) => {
      const t = new Date(o.item.createdAt).getTime();
      return t >= gFrom.getTime() && t <= gTo.getTime();
    });

    // Dashboard KPIs
    const revenue = ordersInRange
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + n(o.total_amount), 0);

    const totalOrderItems = ordersItemInRange.length;
    const totalOrders = ordersInRange.length;
    // Growth calculation (compare with previous period of same duration)
    const durationMs = gTo.getTime() - gFrom.getTime();
    const prevFrom = new Date(gFrom.getTime() - durationMs);
    const prevTo = new Date(gTo.getTime() - durationMs);

    const prevOrders = this.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= prevFrom.getTime() && t < gFrom.getTime();
    });

    const prevRevenue = prevOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + n(o.total_amount), 0);

    const revGrowth = prevRevenue === 0 ? 100 : ((revenue - prevRevenue) / prevRevenue) * 100;
    const ordGrowth =
      prevOrders.length === 0
        ? 100
        : ((totalOrderItems - prevOrders.length) / prevOrders.length) * 100;

    const activeOrders = ordersInRange.filter((o) => ['uncompleted'].includes(o.status)).length;

    const customersCount = new Set(ordersInRange.map((o) => o.user_id)).size;

    // Status distribution (Global)
    const statusCount: Record<OrderStatus, number> = {
      pending: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      return_requested: 0,
      returned: 0,
      exchange_requested: 0,
      exchanged: 0,
    };
    for (const o of ordersItemInRange) statusCount[o.item.status as OrderStatus]++;
    const donut = this.buildDonut(statusCount);

    // Recent orders (Max 5) - Global Filtered
    const recentOrders = [...ordersInRange]
      .sort((a, b) => safeText(b.createdAt).localeCompare(safeText(a.createdAt)))
      .slice(0, 5)
      .map((o) => {
        const u = this.users.find((x) => x._id === o.user_id._id);
        return {
          ...o,
          customer_name: u ? ` ${u.name}`.trim() : 'Khách vãng lai',
          customer_phone: u?.phone ?? '',
        };
      });

    // Inventory Alerts (Static placeholder data for expansion)
    const lowStockAlerts = this.products.slice(10, 15).map((p) => ({
      product_id: p._id,
      product_name: p.product_name,
      image_url: p.main_image,
      stock: Math.floor(Math.random() * 5) + 1,
      threshold: 10,
    }));

    // CHART RANGE (Follow Global)
    const diffDays = Math.ceil((gTo.getTime() - gFrom.getTime()) / (1000 * 60 * 60 * 24));
    let mode: RangeMode = 'day';
    if (diffDays > 14 && diffDays <= 60) mode = 'week';
    if (diffDays > 60) mode = 'month';

    const series = this.buildSeries(ordersInRange, gFrom, gTo, mode);

    return {
      revenue,
      revGrowth,
      totalOrders,
      totalOrderItems,
      ordGrowth,
      activeOrders,
      customers: customersCount,
      statusCount,
      donut,
      recent: recentOrders,
      lowStockAlerts,
      series,
    };
  }

  // ===== chart builders =====
  private buildSeries(orders: IOrderAdmin[], from: Date, to: Date, mode: RangeMode) {
    type Bucket = { key: string; label: string; revenue: number; orders: number };
    const buckets: Bucket[] = [];

    const startOfTo = startOfDay(to);
    const startOfFrom = startOfDay(from);

    if (mode === 'day') {
      const days =
        Math.floor((startOfTo.getTime() - startOfFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const count = Math.min(31, days); // limit buckets for safety
      for (let i = 0; i < count; i++) {
        const d = addDays(startOfFrom, i);
        const k = isoDate(d.toISOString());
        buckets.push({ key: k, label: k.slice(5), revenue: 0, orders: 0 });
      }
    } else if (mode === 'week') {
      let current = new Date(startOfFrom);
      while (current <= startOfTo) {
        // find start of week (Monday or simply chunk by 7 days)
        const wStart = new Date(current);
        const wEnd = addDays(wStart, 6) > startOfTo ? new Date(startOfTo) : addDays(wStart, 6);
        const key = `${isoDate(wStart.toISOString())}_${isoDate(wEnd.toISOString())}`;
        buckets.push({
          key,
          label: `${String(wStart.getDate()).padStart(2, '0')}/${String(
            wStart.getMonth() + 1,
          ).padStart(2, '0')}`,
          revenue: 0,
          orders: 0,
        });
        current = addDays(wEnd, 1);
        if (buckets.length > 20) break;
      }
    } else {
      let current = new Date(startOfFrom.getFullYear(), startOfFrom.getMonth(), 1);
      const endMonth = new Date(startOfTo.getFullYear(), startOfTo.getMonth(), 1);
      while (current <= endMonth) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label: key, revenue: 0, orders: 0 });
        current.setMonth(current.getMonth() + 1);
        if (buckets.length > 24) break;
      }
    }

    for (const o of orders) {
      const t = new Date(o.createdAt);
      const tStart = startOfDay(t);

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
  // Thể hiện vòng tròn
  private buildDonut(statusCount: Record<OrderStatus, number>) {
    const total = Object.values(statusCount).reduce((a, b) => a + b, 0) || 1;

    const parts = [
      { key: 'delivered', label: 'Đã giao', value: statusCount.delivered },
      { key: 'shipped', label: 'Đang giao', value: statusCount.shipped },
      { key: 'packed', label: 'Đã xác nhận', value: statusCount.packed },
      { key: 'pending', label: 'Chờ xác nhận', value: statusCount.pending },
      { key: 'cancelled', label: 'Đã huỷ', value: statusCount.cancelled },
      { key: 'returned', label: 'Y/c trả hàng', value: statusCount.returned },
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
  public loadData() {
    // Clear existing for a fresh seed
    this.users = [];
    this.orders = [];
    this.orderItems = [];
    this.products = [];
    this.reviews = [];
    this.error = '';
    this.userService.getAllInfoUser().subscribe({
      next: (res) => {
        this.users = res.data;
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.orderService.getAllOrdersAdmin().subscribe({
      next: (res) => {
        this.orders = res.data;
        for (const order of this.orders) {
          this.orderService.getOrderDetailAdmin(order._id).subscribe({
            next: (res) => {
              this.orderItems.push(...res.data.items);
            },
            error: (err) => {
              if (err.status === 404 || err.status === 400 || err.status === 401) {
                this.error = err.error?.message || 'Không tìm thây đơn hàng nào';
              } else {
                this.error = 'Có lỗi ở phía server';
              }
              this.toastService.error(`${this.error}`);
              this.cdr.detectChanges();
            },
          });
        }
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.productService.getBestSellerProduct().subscribe({
      next: (res) => {
        this.products = res.data;
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.reviewService.getNewsReviewByAdmin().subscribe({
      next: (res) => {
        this.reviews = res.data;
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây đánh giá nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
  }

  // ===== labels (MATCH management-orders) =====
  statusLabel(s: string) {
    switch (s) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'packed':
        return 'Đã xác nhận';
      case 'shipped':
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

  statusPillClass(s: string) {
    switch (s) {
      case 'pending':
        return 'pill-pending';
      case 'packed':
        return 'pill-packed';
      case 'shipped':
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

  statusPillColor(s: OrderStatus | string) {
    switch (s) {
      case 'pending':
        return '#fbbf24'; // yellow
      case 'packed':
        return '#818cf8'; // indigo
      case 'shipping':
        return '#38bdf8'; // sky blue
      case 'delivered':
        return '#22c55e'; // green
      case 'cancelled':
        return '#ef4444'; // red
      case 'return_requested':
        return '#f97316'; // orange
      case 'exchange_requested':
        return '#a78bfa'; // purple
      case 'returned':
        return '#94a3b8'; // slate
      case 'exchanged':
        return '#6ee7b7'; // teal
      default:
        return '#94a3b8';
    }
  }

  fmtVND(x: number) {
    return `${n(x).toLocaleString('vi-VN')}đ`;
  }

  fmtDateTime(iso: string | Date) {
    return formatVNDateTimeShort(iso instanceof Date ? iso.toISOString() : iso);
  }

  stars(nStar: number) {
    const k = Math.max(0, Math.min(5, Math.floor(n(nStar, 0))));
    return '★'.repeat(k) + '☆'.repeat(5 - k);
  }
}
