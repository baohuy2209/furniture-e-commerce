import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-discount-products',
  templateUrl: './discount-products.html',
  styleUrl: './discount-products.css',
  standalone: true,
  imports: [DecimalPipe],
})
export class DiscountProductsComponent {
  // Aligned with ERD `PRODUCT` and `PRODUCT_VARIANT` tables
  discount_products = [
    {
      product_name: 'Ghế Sofa Đơn Hiện Đại',
      description: 'Ghế sofa được thiết kế tối giản, chất liệu vải cao cấp...',
      discount_percent: 10,
      price: 12000000,
      original_price: 15000000, // Derived or stored
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=300&h=300&fit=crop',
      theme: 'beige',
    },
    {
      product_name: 'Bàn Làm Việc Gỗ Sồi',
      description: 'Bàn làm việc gỗ sồi tự nhiên, thiết kế thông minh...',
      discount_percent: 20,
      price: 6800000,
      original_price: 8500000,
      rating: 5.0,
      image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300&h=300&fit=crop',
      theme: 'blue',
      badge_text: 'BÁN CHẠY', // Maps to derived logic from `num_sold` in real app
    },
  ];
}
