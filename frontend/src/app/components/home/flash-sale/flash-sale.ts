import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flash-sale',
  imports: [],
  standalone: true,
  templateUrl: './flash-sale.html',
  styleUrl: './flash-sale.css',
})
export class FlashSale {
  constructor(private router: Router) {}
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
      image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      is_highlight: false,
    },
    {
      category_name: 'CHAIR',
      image_url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0',
      is_highlight: true,
    },
  ];
  navigateProduct() {
    // Placeholder for navigation logic, e.g. using Angular Router
    this.router.navigate(['/products']);
  }
}
