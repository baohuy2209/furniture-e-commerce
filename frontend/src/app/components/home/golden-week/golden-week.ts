import { Component } from '@angular/core';

@Component({
  selector: 'app-golden-week',
  imports: [],
  templateUrl: './golden-week.html',
  styleUrl: './golden-week.css',
})
export class GoldenWeek {
  // Aligned with ERD `EVENT` table
  event_data = {
    event_name: 'Tuần Lễ Vàng',
    description: 'Giảm giá đến 50% - Số lượng có hạn',
    brand_highlight: 'HomeBase', // Added context for UI
    start_time: '2026-03-01T00:00:00',
    end_time: '2026-03-07T23:59:59',
  };

  // UI-specific timer derived from start_time/end_time in a real app
  timer_units = [
    { value: '04', label: 'NGÀY' },
    { value: '10', label: 'GIỜ' },
    { value: '45', label: 'PHÚT' },
    { value: '07', label: 'GIÂY' },
  ];
}
