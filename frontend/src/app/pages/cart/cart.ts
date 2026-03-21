import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartStateService, ICartItemPopulated } from '../../services/cart-state-service';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cartItems: (ICartItemPopulated & { selected: boolean })[] = [];
  error: string = '';
  constructor(
    public cartState: CartStateService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cartState.syncCart().subscribe({
      next: () => {
        this.cartItems = this.cartState.items().map((item) => ({
          ...item,
          selected: false,
        }));

        console.log(this.cartItems);
      },
    });
  }

  increaseQuantity(id: string, currentQty: number) {
    const item = this.cartItems.find((i) => i._id === id);
    if (item) {
      item.quantity = currentQty + 1;
      this.cartState.addItem(item.product_variant_id._id, 1).subscribe({
        next: (res) => {
          this.toastService.success(`${res.message}`);
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thấy item giỏ hàng nào';
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.toastService.error(`${this.error}`);
          this.cdr.detectChanges();
        },
      });
    }
  }

  decreaseQuantity(id: string, currentQty: number) {
    const item = this.cartItems.find((i) => i._id === id);
    if (item) {
      item.quantity = currentQty - 1;
      this.cartState.updateQuantity(item._id, item.quantity).subscribe({
        next: (res) => {
          this.toastService.success(`${res.message}`);
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thấy item giỏ hàng nào';
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.toastService.error(`${this.error}`);
          this.cdr.detectChanges();
        },
      });
    }
  }

  removeItem(id: string) {
    this.cartState.removeItem(id).subscribe({
      next: (res) => {
        this.toastService.success(`${res.message}`);
        setTimeout(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy item giỏ hàng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
  }

  toggleItem(id: string) {
    const item = this.cartItems.find((i) => i._id === id);
    if (item) {
      item.selected = !item.selected;
    }
  }

  toggleAll(event: any) {
    const isChecked = event.target.checked;
    this.cartItems.forEach((item) => (item.selected = isChecked));
  }

  get allSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every((item) => item.selected);
  }

  get totalPrice(): number {
    return this.cartItems
      .filter((item) => item.selected)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get selectedItemsCount(): number {
    return this.cartItems.filter((item) => item.selected).length;
  }

  get totalItems(): number {
    return this.cartItems.length;
  }
  buyProduct() {
    this.router.navigate(['/checkout']);
  }
}
