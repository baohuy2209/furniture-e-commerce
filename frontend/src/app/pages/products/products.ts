import { ProductCategoryService } from './../../services/product-category-service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CardProduct } from '../../components/card-product/card-product';
import { IListProducts, IProductCategory } from '../../../interface';
import { Product } from '../../services/product';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProductColors } from '../../services/product-colors';
import { formatPrice } from '../../utils/utils';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-products',
  imports: [CardProduct, CommonModule, NgxPaginationModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
  standalone: true,
})
export class Products implements OnInit {
  listProduct: IListProducts[] = [];
  currentImageHero: string = 'products-hero/living-room.jpg';
  listImageHero: Record<string, string> = {
    '': 'products-hero/living-room.jpg',
    'living-room': 'products-hero/living-room.jpg',
    bedroom: 'products-hero/bedroom.jpg',
    'dining-room': 'products-hero/dining-room.jpg',
    bathroom: 'products-hero/bathroom.jpg',
    outdoor: 'products-hero/outdoor.jpg',
    accessories: 'products-hero/accessories.jpg',
  };
  currentRoom: string = 'Danh mục sản phẩm';
  listRoom: Record<string, string> = {
    '': 'Danh mục sản phẩm',
    'living-room': 'Phòng khách',
    bedroom: 'Phòng ngủ',
    'dining-room': 'Phòng ăn',
    bathroom: 'Phòng tắm',
    outdoor: 'Ngoài trời',
    accessories: 'Phụ kiện trang trí',
  };
  listProductType: IProductCategory[] = [];
  listProductColor: { name: string; hex: string }[] = [];
  filterPrice: number = 100000000;
  room_type: string = '';
  success: string = '';
  error: string = '';
  page = 1;
  count = 0;
  pageSize = 16;
  percent = 0;
  selectCategory = '';
  isFilter = false;
  constructor(
    private cdr: ChangeDetectorRef,
    private productService: Product,
    private productCategoryService: ProductCategoryService,
    private productColorService: ProductColors,
  ) {}
  ngOnInit(): void {
    this.productService.getAllProducts(this.getRequestParams).subscribe({
      next: (res) => {
        this.listProduct = res.data;
        console.log(this.listProduct);
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
    this.productCategoryService.getAllProductTypeCategories().subscribe({
      next: (res) => {
        this.listProductType = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây loại sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
    this.productColorService.getAllColors().subscribe({
      next: (res) => {
        this.listProductColor = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm màu nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  onInput(value: number) {
    this.percent = (value / 400000000) * 100;
  }
  getRequestParams(searchTitle: string, page: number, pageSize: number): any {
    let params: any = {};
    if (searchTitle) {
      params['title'] = searchTitle;
    }
    if (page) {
      params['page'] = page - 1;
    }
    if (pageSize) {
      params['size'] = pageSize;
    }
    return params;
  }
  getProductByRoomType(room_type: string): void {
    this.productService.getAllProductsByRoomType(room_type).subscribe({
      next: (res) => {
        this.listProduct = res.data;
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
  countProductByRating(rating: number) {
    return this.listProduct.filter((p) => Math.floor(p.rating) === rating).length;
  }
  handlePageChange(event: number): void {
    this.page = event;
    this.getProductByRoomType(this.room_type);
  }
  searchTitle(): void {
    this.page = 1;
    this.getProductByRoomType(this.room_type);
  }
  formatPriceProduct(num: number) {
    return formatPrice(num);
  }
  filterProduct() {
    let filtered = [...this.listProduct]; // clone list

    if (this.selectCategory !== '') {
      filtered = filtered.filter((p) => p.categories.includes(this.selectCategory));
    }

    if (this.filterPrice !== 0) {
      filtered = filtered.filter((p) => p.price <= this.filterPrice);
    }
    this.isFilter = !this.isFilter;
    return filtered; // ✅ QUAN TRỌNG
  }
  resetProduct() {
    this.isFilter = !this.isFilter;
  }
  switchTabs(room_type: string) {
    this.room_type = room_type;
    this.currentImageHero = this.listImageHero[room_type];
    this.currentRoom = this.listRoom[room_type];
    this.getProductByRoomType(room_type);
  }
}
