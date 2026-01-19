import { Component } from '@angular/core';
import { CardProduct } from '../../card-product/card-product';

@Component({
  selector: 'app-best-seller-products',
  imports: [CardProduct],
  templateUrl: './best-seller-products.html',
  styleUrl: './best-seller-products.css',
})
export class BestSellerProducts {}
