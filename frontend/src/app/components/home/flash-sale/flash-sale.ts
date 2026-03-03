import { Component } from '@angular/core';

@Component({
  selector: 'app-flash-sale',
  imports: [],
  standalone: true,
  templateUrl: './flash-sale.html',
  styleUrl: './flash-sale.css',
})
export class FlashSale {
  // Aligned with ERD `EVENT` table
  flash_sale_data = {
    event_name: 'Flash Sale: Cuối Tuần',
    tag_text: 'ƯU ĐÃI TUẦN',
    main_time: '0:09',
    total_time: '0:30',
  };

  // Aligned with ERD `CATEGORY` table
  categories = [
    {
      category_name: 'BED',
      image_url:
        'https://images.unsplash.com/photo-1505693419148-de0462054ff5?w=200&h=200&fit=crop',
      is_highlight: false,
    },
    {
      category_name: 'CHAIR',
      image_url:
        'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=200&h=200&fit=crop',
      is_highlight: true,
    },
  ];
}
