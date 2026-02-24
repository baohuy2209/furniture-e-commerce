import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
  variant?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  private cartKey = 'homebase_cart';

  constructor() { }

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const savedCart = localStorage.getItem(this.cartKey);
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
    } else {
      // Mock Data
      this.cartItems = [
        {
          id: 1,
          name: 'Sofa - Góc Hiện Đại Mây & Da',
          price: 1899000,
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
          quantity: 1,
          selected: false,
          variant: 'Xám'
        },
        {
          id: 2,
          name: 'Giường Ngủ Gỗ Sồi Bắc Âu',
          price: 3500000,
          image: 'https://images.unsplash.com/photo-1505693416388-b0346efee535?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
          quantity: 1,
          selected: false,
          variant: 'Nâu Gỗ'
        },
        {
          id: 3,
          name: 'Đèn Bàn Gốm Sứ Cao Cấp',
          price: 450000,
          image: 'https://images.unsplash.com/photo-1513506003013-d531632103f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
          quantity: 2,
          selected: true,
          variant: 'Trắng'
        }
      ];
      this.saveCart();
    }
  }

  saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
    // Dispatch event for header to update
    window.dispatchEvent(new Event('cartUpdated'));
  }

  increaseQuantity(id: number, currentQty: number) {
    const item = this.cartItems.find(i => i.id === id);
    if (item) {
      item.quantity = currentQty + 1;
      this.saveCart();
    }
  }

  decreaseQuantity(id: number, currentQty: number) {
    const item = this.cartItems.find(i => i.id === id);
    if (item && currentQty > 1) {
      item.quantity = currentQty - 1;
      this.saveCart();
    }
  }

  removeItem(id: number) {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      this.cartItems = this.cartItems.filter(i => i.id !== id);
      this.saveCart();
    }
  }

  toggleItem(id: number) {
    const item = this.cartItems.find(i => i.id === id);
    if (item) {
      item.selected = !item.selected;
      this.saveCart();
    }
  }

  toggleAll(event: any) {
    const isChecked = event.target.checked;
    this.cartItems.forEach(item => item.selected = isChecked);
    this.saveCart();
  }

  get allSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
  }

  get totalPrice(): number {
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  get selectedItemsCount(): number {
    return this.cartItems.filter(item => item.selected).length;
  }

  get totalItems(): number {
    return this.cartItems.length;
  }
}
