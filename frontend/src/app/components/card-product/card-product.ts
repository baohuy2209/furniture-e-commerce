import { Component, Input } from '@angular/core';
import { IListProducts } from '../../../interface';
import { formatPrice } from '../../utils/utils';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-product',
  imports: [CommonModule],
  templateUrl: './card-product.html',
  styleUrl: './card-product.css',
  standalone: true,
})
export class CardProduct {
  @Input() productInfo!: IListProducts;
  constructor(private router: Router) {}
  count_price_discount(): string {
    const price_discount = this.productInfo.price * (1 - this.productInfo.discount_percent / 100);
    return formatPrice(price_discount);
  }
  count_original_price(): string {
    return formatPrice(this.productInfo.price);
  }
  navigateProductDetail() {
    this.router.navigate(['/products', this.productInfo._id]);
  }
}
