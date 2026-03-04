
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WarrantyItem {
  id: number;
  productName: string;
  variant: string;
  note: string;
  image: string;
  orderId: string;
  orderDate: string;
  receiveDate: string;
  warrantyEndDate: string;

  // Pricing
  unitPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;

  // Order Details (for expanded view)
  paymentMethod: string;
  address: string;
  orderTotalValue: number;
}

@Component({
  selector: 'app-requests-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests-warranty.html',
  styleUrl: './requests-warranty.css',
})
export class RequestsWarranty {
  searchTerm: string = '';
  expandedItemId: number | null = null;

  // Popup State
  showWarrantyPopup: boolean = false;
  selectedWarrantyItem: WarrantyItem | null = null;

  // Form Data
  warrantyMethod: string = 'home'; // Default to 'Bảo hành tại nhà'
  warrantyNote: string = '';
  agreedToTerms: boolean = false;

  warrantyItems: WarrantyItem[] = [
    {
      id: 1,
      productName: 'Sofa - Góc Hiện Đại Mây & Da',
      variant: 'Xám',
      note: 'Cấu trúc màu xám tro mè sơn mài',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
      orderId: '0000000123456',
      orderDate: '17/11/2025',
      receiveDate: '30/12/2025',
      warrantyEndDate: '30/10/2026',
      unitPrice: 1999000,
      quantity: 1,
      discount: 100000,
      totalPrice: 1899000,
      paymentMethod: 'Tiền mặt',
      address: '120 Yên Lãng, Đống Đa, Hà Nội',
      orderTotalValue: 21899000
    },
    {
      id: 2,
      productName: 'Sofa - Góc Hiện Đại Mây & Da',
      variant: 'Xám',
      note: 'Cấu trúc màu xám tro mè sơn mài',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
      orderId: '0000000123456',
      orderDate: '17/11/2025',
      receiveDate: '30/12/2025',
      warrantyEndDate: '30/10/2026',
      unitPrice: 1999000,
      quantity: 1,
      discount: 100000,
      totalPrice: 1899000,
      paymentMethod: 'Tiền mặt',
      address: '120 Yên Lãng, Đống Đa, Hà Nội',
      orderTotalValue: 21899000
    },
    {
      id: 3,
      productName: 'Sofa - Góc Hiện Đại Mây & Da',
      variant: 'Xám',
      note: 'Cấu trúc màu xám tro mè sơn mài',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
      orderId: '0000000123456',
      orderDate: '17/11/2025',
      receiveDate: '30/12/2025',
      warrantyEndDate: '30/10/2026',
      unitPrice: 1999000,
      quantity: 1,
      discount: 100000,
      totalPrice: 1899000,
      paymentMethod: 'Tiền mặt',
      address: '120 Yên Lãng, Đống Đa, Hà Nội',
      orderTotalValue: 21899000
    }
  ];

  toggleExpand(id: number) {
    if (this.expandedItemId === id) {
      this.expandedItemId = null;
    } else {
      this.expandedItemId = id;
    }
  }

  openWarrantyPopup(item: WarrantyItem) {
    // console.log('Opening popup for:', item);
    // alert('Popup Clicked! ' + item.productName);
    this.selectedWarrantyItem = item;
    this.showWarrantyPopup = true;
    this.agreedToTerms = false; // Reset
    this.warrantyMethod = 'home'; // Reset
  }

  closeWarrantyPopup() {
    this.showWarrantyPopup = false;
    this.selectedWarrantyItem = null;
  }
}
