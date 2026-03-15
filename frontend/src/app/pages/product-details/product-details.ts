import { ProductVariantService } from './../../services/product-variant-service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ImageGallery } from '../../components/product-details/image-gallery/image-gallery';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductVariantImageService } from '../../services/product-variant-image-service';
import {
  IListProducts,
  Iproduct,
  Iproduct_variants,
  Iproduct_variants_image,
} from '../../../interface';
import { Product } from '../../services/product';
import { formatPrice } from '../../utils/utils';
import { CardProduct } from "../../components/card-product/card-product";
import { ProductReviews } from "../../components/product-details/product-reviews/product-reviews";

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ImageGallery, RouterLink, CardProduct, ProductReviews],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  product_id: string | null = '';
  relatedProducts: IListProducts[] = [];
  // Chọn hình ảnh cho product
  activeIndex = 0;
  product_details: {
    productInfo: Iproduct;
    defaultProductVariant: Iproduct_variants;
    listMainImageDefaultProduct: Iproduct_variants_image[];
  } | null = null;
  current_product_variant: Iproduct_variants | null = null;
  success: string = '';
  error: string = '';
  isOpen = false;
  images: Iproduct_variants_image[] = [];
  productVariantComponent: Record<string, string[]> = {};
  productVariantComponentActive: Record<string, number> = {};
  qty = 1;

  selectedLeg = 'beige';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: Product,
    private productVariantService: ProductVariantService,
    private productVariantImageSerivce: ProductVariantImageService,
    private cdr: ChangeDetectorRef,
  ) {}
  setActive(index: number): void {
    this.activeIndex = index;
  }
  ngOnInit(): void {
    this.product_id = this.route.snapshot.paramMap.get('id');
    this.productService.getProductDetail(this.product_id!).subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy sản phẩm nào';
          this.cdr.detectChanges();
        }
        this.product_details = res.data;
        // console.log(res.data);
        this.images = res.data.listMainImageDefaultProduct;
        this.current_product_variant = res.data.defaultProductVariant;
        if (res.data.productInfo.product_component) {
          for (const [key, value] of Object.entries(res.data.productInfo.product_component)) {
            this.productVariantComponent[key] = value;
            this.productVariantComponentActive[key] = 0;
          }
        }
        this.success = res.message;
        this.productService.getRelatedProduct(res.data.productInfo.categories).subscribe({
          next: (res) => {
            this.relatedProducts = res.data;
            this.success = res.message;
          },
          error: (err) => {
            if (err.status === 404 || err.status === 400 || err.status === 401) {
              this.error = err.error?.message || 'Không tìm thây thông tin chi tiết sản phẩm';
            } else {
              this.error = 'Có lỗi ở phía server';
            }
            this.cdr.detectChanges();
          },
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây thông tin chi tiết sản phẩm';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  incQty(): void {
    this.qty++;
  }
  decQty(): void {
    if (this.qty > 1) this.qty--;
  }
  countFormatPrice(price: number) {
    return formatPrice(price);
  }
  countPricePercent(price: number, discount_percent: number) {
    const discount_price = Math.floor(price * (1 - discount_percent / 100));
    return this.countFormatPrice(discount_price);
  }
  addToCart(): void {
    // console.log('Add to cart', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
  }

  buyNow(): void {
    // console.log('Buy now', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
  }
  getType(value: any): string {
    return typeof value;
  }
  selectComponentVariantValue(key: string, index: number) {
    this.productVariantComponentActive[key] = index;
    console.log(this.productVariantComponentActive);
  }
  selectUpholsteryAndClose(option: string): void {
    // this.selectedId = option.id;
    // this.selectedOption = option;
    // this.optionSelected.emit(option);
    // this.isOpen = false;
    console.log(option);
  }
}
