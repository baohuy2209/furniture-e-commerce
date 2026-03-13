import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CardProduct } from '../../card-product/card-product';
import { IListProducts } from '../../../../interface';
import { Product } from '../../../services/product';

@Component({
  selector: 'app-best-seller-products',
  imports: [CardProduct],
  templateUrl: './best-seller-products.html',
  styleUrl: './best-seller-products.css',
  standalone: true,
})
export class BestSellerProducts implements OnInit {
  listBestSellerProducts: IListProducts[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private cdr: ChangeDetectorRef,
    private productService: Product,
  ) {}
  ngOnInit(): void {
    this.productService.getBestSellerProduct().subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy sản phẩm nào';
          this.cdr.detectChanges();
        }
        this.listBestSellerProducts = res.data;
        // console.log(res.data);
        this.success = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
}
