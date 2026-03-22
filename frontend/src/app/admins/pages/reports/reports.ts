import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface KPI {
  label: string;
  value: string;
  trend: number; // percentage
  trend_up: boolean;
  icon: string;
}

interface CHART_BUCKET {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

@Component({
  standalone: true,
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  activeRange: 'day' | 'week' | 'month' | 'year' = 'month';
  g_from_date = '';
  g_to_date = '';

  kpis: KPI[] = [
    { label: 'Tổng Sản Phẩm', value: '0', trend: 1.5, trend_up: true, icon: 'bi-box-seam' },
    { label: 'Khách Hàng', value: '0', trend: 2.1, trend_up: true, icon: 'bi-person-lines-fill' },
    { label: 'Thương Hiệu', value: '0', trend: 0.8, trend_up: true, icon: 'bi-tags' },
    { label: 'AOV (Trung bình)', value: '860.000đ', trend: 3.4, trend_up: true, icon: 'bi-calculator' },
  ];

  topSoldProducts: any[] = [];

  ngOnInit(): void {
    const today = new Date();
    this.g_to_date = today.toISOString().slice(0, 10);
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    this.g_from_date = start.toISOString().slice(0, 10);
    
    this.fetchReports();
  }

  async fetchReports() {
    try {
      const resp = await fetch('http://localhost:3000/api/reports/summary');
      if (resp.ok) {
        const body = await resp.json();
        if (body.success) {
           this.kpis[0].value = (body.data.counts?.products || 0).toString();
           this.kpis[1].value = (body.data.counts?.users || 0).toString();
           this.kpis[2].value = (body.data.counts?.brands || 0).toString();
           
           this.topSoldProducts = body.data.latestProducts?.map((p: any) => ({
             name: p.product_name,
             brand: p.brand?.brand_name || 'Không có',
             discount: p.discount_percent + '%',
             warranty: p.warranty ? p.warranty + ' tháng' : 'Không định nghĩa',
           })) || [];
        }
      }
    } catch(err) {
      console.error('Failed to fetch reports', err);
    }
  }

  get chartSeries() {
    // Generate buckets for last 12 months for visual
    const buckets: CHART_BUCKET[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `Thg ${d.getMonth() + 1}`;
      buckets.push({
        key: label,
        label,
        revenue: 40000000 + Math.random() * 80000000,
        orders: 100 + Math.random() * 200,
      });
    }

    const revMax = Math.max(1, ...buckets.map((b) => b.revenue));
    const width = 1000;
    const height = 300;
    const padX = 40;
    const padY = 40;
    const xStep = (width - padX * 2) / (buckets.length - 1);

    const points = buckets.map((b, i) => {
      const x = padX + i * xStep;
      const y = padY + (height - padY * 2) * (1 - b.revenue / revMax);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return { buckets, points, width, height, revMax };
  }

  fmtVND(v: number) {
    return Number(v.toFixed(0)).toLocaleString('vi-VN') + 'đ';
  }

  onRangeChange(range: any) {
    this.activeRange = range;
    // Logic to update dates or reload data
  }
}
