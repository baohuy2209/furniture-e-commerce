import { Injectable, signal, computed, NgZone } from '@angular/core';
import { tap, map, switchMap } from 'rxjs';
import { ICart, ICartItem } from '../../interface';
import { CartService } from './cart-service';
import { ProductVariantImageService } from './product-variant-image-service';
import { forkJoin } from 'rxjs';
export interface ICartItemPopulated extends Omit<ICartItem, 'product_variant_id'> {
  product_variant_id: {
    _id: string;
    sku: string;
    price: number;
    product: {
      _id: string;
      product_name: string;
      main_image: string;
      discount_percent: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class CartStateService {
  readonly cart = signal<ICart | null>(null);
  readonly items = signal<ICartItemPopulated[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly totalItems = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly totalPrice = computed(() => this.items().reduce((sum, i) => sum + i.subtotal, 0));

  constructor(
    private cartService: CartService,
    private productVariantImageService: ProductVariantImageService,
    private zone: NgZone,
  ) {}

  // ── Sync từ server ────────────────────────────────────────────────────
  syncCart() {
    this.loading.set(true);
    return this.cartService.getCart().pipe(
      // ✅ switchMap thay vì tap — giữ trong cùng 1 Observable chain
      switchMap((res) => {
        this.cart.set(res.data.cart);
        const listCartItems = res.data.cartItems;

        if (listCartItems.length === 0) {
          this.items.set([]);
          this.loading.set(false);
          return [];
        }

        const imageRequests = listCartItems.map((item: any) =>
          this.productVariantImageService.getDefaultImageByProductVariantId(
            item.product_variant_id._id,
          ),
        );

        // ✅ forkJoin nằm trong chain → Angular zone tự track
        return forkJoin(imageRequests).pipe(
          map((imageResults: any[]) => {
            return listCartItems.map((item: any, index: number) => ({
              ...item,
              product_variant_id: {
                _id: item.product_variant_id._id,
                sku: item.product_variant_id.sku,
                price: item.product_variant_id.price,
                product: {
                  _id: item.product_variant_id.product._id,
                  product_name: item.product_variant_id.product.product_name,
                  main_image: imageResults[index].data.url,
                  discount_percent: item.product_variant_id.product.discount_percent,
                },
              },
            })) as ICartItemPopulated[];
          }),
        );
      }),
      // ✅ tap chỉ dùng để set signal sau khi chain hoàn thành
      tap({
        next: (populated) => {
          this.items.set(populated);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Lỗi tải giỏ hàng');
          this.loading.set(false);
        },
      }),
    );
  }

  // ── addItem ───────────────────────────────────────────────────────────
  addItem(product_variant_id: string, quantity: number) {
    this.loading.set(true);
    return this.cartService.addToCart(product_variant_id, quantity).pipe(
      tap({
        next: (res) => {
          const newItem = res.data as unknown as ICartItemPopulated;
          const existing = this.items().find((i) => i._id === newItem._id);

          if (existing) {
            this.items.update((prev) => prev.map((i) => (i._id === newItem._id ? newItem : i)));
          } else {
            this.items.update((prev) => [newItem, ...prev]);
          }

          this._recalculateCart();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Lỗi thêm sản phẩm');
          this.loading.set(false);
        },
      }),
    );
  }

  // ── updateQuantity ────────────────────────────────────────────────────
  updateQuantity(item_id: string, quantity: number) {
    if (quantity <= 0) return this.removeItem(item_id);

    this.loading.set(true);
    return this.cartService.updateQuantity(item_id, quantity).pipe(
      tap({
        next: () => {
          this.items.update((prev) =>
            prev.map((i) => {
              if (i._id !== item_id) return i;
              const discountedPrice = i.price * (1 - i.discount_percent / 100);
              return { ...i, quantity, subtotal: quantity * discountedPrice };
            }),
          );
          this._recalculateCart();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Lỗi cập nhật số lượng');
          this.loading.set(false);
        },
      }),
    );
  }

  // ── removeItem ────────────────────────────────────────────────────────
  removeItem(item_id: string) {
    this.loading.set(true);
    return this.cartService.removeItem(item_id).pipe(
      tap({
        next: () => {
          this.items.update((prev) => prev.filter((i) => i._id !== item_id));
          this._recalculateCart();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Lỗi xóa sản phẩm');
          this.loading.set(false);
        },
      }),
    );
  }

  // ── clearCart ─────────────────────────────────────────────────────────
  clearCart() {
    this.loading.set(true);
    return this.cartService.clearCart().pipe(
      tap({
        next: () => {
          this.items.set([]);
          this._recalculateCart();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Lỗi xóa giỏ hàng');
          this.loading.set(false);
        },
      }),
    );
  }

  // ── Helper ────────────────────────────────────────────────────────────
  private _recalculateCart() {
    this.cart.update((prev) =>
      prev
        ? {
            ...prev,
            total_item: this.totalItems(),
            total_amount: this.totalPrice(),
          }
        : null,
    );
  }
}
