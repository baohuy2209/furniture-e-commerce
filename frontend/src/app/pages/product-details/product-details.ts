import { CartStateService } from './../../services/cart-state-service';
import { ProductVariantService } from './../../services/product-variant-service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { ImageGallery } from '../../components/product-details/image-gallery/image-gallery';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductVariantImageService } from '../../services/product-variant-image-service';
import {
  IAddress,
  IListProducts,
  Iproduct,
  Iproduct_variants,
  Iproduct_variants_image,
  IUser,
} from '../../../interface';
import { Product } from '../../services/product';
import { formatPrice } from '../../utils/utils';
import { CardProduct } from '../../components/card-product/card-product';
import { ProductReviews } from '../../components/product-details/product-reviews/product-reviews';
import { ToastService } from '../../services/toast-service';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AddressService } from '../../services/address-service';
import { UserService } from '../../services/user-service';
import { OrderServices } from '../../services/order-services';
declare var bootstrap: any;
const SHIPPING_FEE_FOR_GUEST = 150000;
interface Province {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}
@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ImageGallery, RouterLink, CardProduct, ProductReviews, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  @ViewChild('userInfoModal') userInfoModal!: ElementRef;
  @ViewChild('addAddressModal') addAddressModal!: ElementRef;
  private addressModalInstance: any;
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
  newAddress = {
    _id: '',
    user: '',
    name: '',
    phone: '',
    province: '',
    ward: '',
    address_detail: '',
    is_default: true,
  };
  guestUser = {
    name: '',
    phone: '',
    email: '',
  };
  newGuestUser: IUser | null = null;
  newAddressGuestUser: IAddress | null = null;
  provinces = signal<Province[]>([]);
  wards = signal<Ward[]>([]);
  isShowAddressModel: boolean = false;
  isShowUserInfoModal: boolean = false;
  selectedLeg = 'beige';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: Product,
    private productVariantService: ProductVariantService,
    private productVariantImageSerivce: ProductVariantImageService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private authService: AuthService,
    private cartState: CartStateService,
    private http: HttpClient,
    private userAddressService: AddressService,
    private userService: UserService,
    private orderService: OrderServices,
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
        this.toastService.success(`${this.success}`);
        this.productService.getRelatedProduct(res.data.productInfo.categories).subscribe({
          next: (res) => {
            this.relatedProducts = res.data;
            this.success = res.message;
            this.toastService.success(`${this.success}`);
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
    this.http
      .get<Province[]>('http://localhost:3000/provinces')
      .subscribe((data) => this.provinces.set(data));
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
  onProvinceChange(code: string) {
    if (!code) {
      this.wards.set([]);
      this.newAddress.ward = '';
      return;
    }
    this.http
      .get<any>(`http://localhost:3000/provinces/${code}`)
      .subscribe((data) => this.wards.set(data.wards ?? []));
  }
  countPricePercent(price: number, discount_percent: number) {
    const discount_price = Math.floor(price * (1 - discount_percent / 100));
    return this.countFormatPrice(discount_price);
  }
  addToCart(): void {
    // console.log('Add to cart', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
    const token = this.authService.getAccessToken();
    if (token) {
      this.cartState
        .addItem(
          this.current_product_variant?._id ?? this.product_details?.defaultProductVariant._id!,
          this.qty,
        )
        .subscribe({
          next: (res) => {
            this.toastService.success(
              `Đã thêm sản phẩm ${this.product_details?.productInfo.product_name} vào giỏ hàng`,
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
    } else {
      this.toastService.error(`Bạn chưa đăng nhập để sử dụng giỏ hàng`);
    }
  }

  buyNow(): void {
    // console.log('Buy now', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
    const token = this.authService.getAccessToken();
    if (token) {
      this.cartState
        .addItem(
          this.current_product_variant?._id ?? this.product_details?.defaultProductVariant._id!,
          this.qty,
        )
        .subscribe({
          next: (res) => {
            this.toastService.success(
              `Đã thêm sản phẩm ${this.product_details?.productInfo.product_name} vào giỏ hàng`,
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
      this.router.navigate(['/checkout']);
    } else {
      this.isShowUserInfoModal = true;
      setTimeout(() => {
        const modal = new bootstrap.Modal(this.userInfoModal.nativeElement);
        modal.show();
      }, 0);
    }
  }
  getType(value: any): string {
    return typeof value;
  }
  createAddressForGuest(f: any) {
    if (f.invalid) {
      this.error = 'Vui lòng kiểm tra lại thông tin địa chỉ';
      return;
    }
    if (!this.newGuestUser) {
      this.toastService.error('Bạn chưa nhập thông tin người dùng');
      return;
    }
    const selectedProvince = this.provinces().find(
      (p) => String(p.code) === this.newAddress.province,
    );
    this.newAddress.user = this.newGuestUser?._id!;
    this.newAddress.province = selectedProvince?.name!;
    this.userAddressService.createNewAddress(this.newAddress).subscribe({
      next: (res) => {
        this.success = `Đã tạo địa chỉ mới thành công cho người dùng ${res.data.name}`;
        this.toastService.success(`${this.success}`);
        f.reset();
        this.isShowAddressModel = false;
        this.newAddressGuestUser = res.data;
        this.addressModalInstance?.hide();
        this.orderService
          .checkoutWithoutLogin(
            this.newGuestUser?._id!,
            this.current_product_variant?._id!,
            this.qty,
            this.newAddressGuestUser._id,
            SHIPPING_FEE_FOR_GUEST,
            '',
          )
          .subscribe({
            next: (res) => {
              this.success = `Tạo đơn hàng thành công cho ${this.newGuestUser?.name}`;
              this.toastService.success(`${this.success}`);
              this.cdr.detectChanges();
            },
            error: (err) => {
              if (err.status === 404 || err.status === 400 || err.status === 401) {
                this.error =
                  err.error?.message || 'Có lỗi khi tạo đơn hàng khi người dùng không đăng nhập';
              } else {
                this.error = 'Có lỗi ở phía server';
              }
              this.toastService.error(`${this.error}`);
              this.cdr.detectChanges();
            },
          });
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
  }
  createUserGuest(f: any) {
    if (f.invalid) {
      this.error = 'Vui lòng kiểm tra lại thông tin địa chỉ';
      return;
    }
    this.userService.createUser(this.guestUser).subscribe({
      next: (res) => {
        this.newGuestUser = res.data;
        this.isShowUserInfoModal = false;
        this.newAddress.name = this.newGuestUser.name;
        this.newAddress.phone = this.newGuestUser.phone;
        this.isShowAddressModel = true;
        this.toastService.success(`Thêm thông tin khách hàng thành công`);
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.addAddressModal?.nativeElement) {
            this.addressModalInstance = new bootstrap.Modal(this.addAddressModal.nativeElement);
            this.addressModalInstance.show();
          }
        }, 1000);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
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
