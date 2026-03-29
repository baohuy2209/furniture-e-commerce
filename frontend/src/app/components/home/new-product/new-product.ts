import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CardProduct } from '../../card-product/card-product';
import { IListProducts } from '../../../../interface';
import { Product } from '../../../services/product';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-product',
  imports: [CardProduct],
  templateUrl: './new-product.html',
  styleUrl: './new-product.css',
  standalone: true,
})
export class NewProduct implements OnInit {
  listNewsProducts: IListProducts[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private cdr: ChangeDetectorRef,
    private productService: Product,
    private router: Router,
  ) {}
  navigateProduct() {
    // Placeholder for navigation logic, e.g. using Angular Router
    this.router.navigate(['/products']);
  }
  ngOnInit(): void {
    this.productService.getNewProducts().subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy sản phẩm nào';
          this.cdr.detectChanges();
        }
        this.listNewsProducts = res.data;
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
  onClick() {
    this.router.navigate(['/products']);
  }
}
