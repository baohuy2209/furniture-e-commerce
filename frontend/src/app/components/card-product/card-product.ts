import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { IListProducts } from '../../../interface';
import { formatPrice } from '../../utils/utils';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartStateService } from '../../services/cart-state-service';
import { Product } from '../../services/product';
import { ToastService } from '../../services/toast-service';
import { AuthService } from '../../services/auth';
import { StockItemService } from '../../services/stock-item-service';
@Component({
  selector: 'app-card-product',
  imports: [CommonModule],
  templateUrl: './card-product.html',
  styleUrl: './card-product.css',
  standalone: true,
})
export class CardProduct {
  @Input() productInfo!: IListProducts;
  error: string = '';
  isDisplayWarrning: boolean = false;
  constructor(
    private router: Router,
    public cartState: CartStateService,
    private productService: Product,
    private stockItemService: StockItemService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}
  count_price_discount(): string {
    const price_discount = this.productInfo.price * (1 - this.productInfo.discount_percent / 100);
    return formatPrice(price_discount);
  }
  count_original_price(): string {
    return formatPrice(this.productInfo.price);
  }
  navigateProductDetail() {
    this.productService.getProductDetail(this.productInfo._id).subscribe({
      next: (res) => {
        this.stockItemService
          .getStockItemByProductVariantId(res.data.defaultProductVariant._id)
          .subscribe({
            next: (res) => {
              if (res.data.quantity_on_hand === 0) {
                this.isDisplayWarrning = true;
                setTimeout(() => {
                  this.isDisplayWarrning = false;
                });
              }
              this.navigate();
            },
            error: (err) => {
              if (err.status === 404 || err.status === 400 || err.status === 401) {
                this.error = err.error?.message || 'Không tìm thây tồn kho của sản phẩm nào';
              } else {
                this.error = 'Có lỗi ở phía server';
              }
              this.toastService.error(`${this.error}`);
            },
          });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây loại sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
      },
    });
  }
  navigate() {
    this.router.navigate(['/products', this.productInfo._id]);
  }
  addCart() {
    const token = this.authService.getAccessToken();
    if (token) {
      this.productService.getProductDetail(this.productInfo._id).subscribe({
        next: (res) => {
          this.cartState.addItem(res.data.defaultProductVariant._id, 1).subscribe({
            next: (res) => {
              this.toastService.success(
                `Đã thêm sản phẩm ${this.productInfo.product_name} vào giỏ hàng`,
              );
            },
            error: (err) => {
              if (err.status === 404 || err.status === 400 || err.status === 401) {
                this.error = err.error?.message || 'Không tìm thây giỏ hàng nào';
              } else {
                this.error = 'Có lỗi ở phía server';
              }
              this.toastService.error(`${this.error}`);
            },
          });
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thây giỏ hàng nào';
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.toastService.error(`${this.error}`);
        },
      });
    } else {
      this.toastService.error(`Bạn chưa đăng nhập để sử dụng giỏ hàng`);
    }
  }
}
