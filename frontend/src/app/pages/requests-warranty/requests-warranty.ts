import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderServices } from '../../services/order-services';
import { ToastService } from '../../services/toast-service';
import { IOrder, IOrderItem, IOrderItemShipping, IPayment, IWarrantyRequest } from '../../../interface';
import { forkJoin, map } from 'rxjs';

export interface IOrderWithItems extends IOrder {
  items: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[];
}

interface SelectedProduct {
  orderId: string;
  orderDate: string;
  item: IOrderItem;
  shipping: IOrderItemShipping;
  payment: IPayment;
}

@Component({
  selector: 'app-requests-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests-warranty.html',
  styleUrl: './requests-warranty.css',
})
export class RequestsWarranty implements OnInit {
  searchTerm: string = '';

  // New Form State
  deliveredOrders: IOrderWithItems[] = [];
  selectedOrderId: string = '';
  availableProducts: SelectedProduct[] = [];
  selectedProductId: string = '';
  selectedProduct: SelectedProduct | null = null;

  loadingOrders: boolean = false;

  // Form Data
  warrantyMethod: string = 'home'; // Default to 'Bảo hành tại nhà'
  warrantyReasons: { label: string, checked: boolean }[] = [
    { label: 'Sản phẩm móp méo, bong tróc', checked: false },
    { label: 'Sản phẩm thiếu thành phần, linh kiện', checked: false },
    { label: 'Sản phẩm sai mẫu mã, kích thước', checked: false },
    { label: 'Sản phẩm sai, thiếu chức năng', checked: false },
    { label: 'Lý do khác', checked: false }
  ];
  warrantyNote: string = '';
  agreedToTerms: boolean = false;
  selectedImages: { file: File, url: string }[] = [];

  // Sent Requests State
  activeListTab: string = 'all';
  sentRequests: any[] = [
    {
      _id: 'REQ001',
      request_date: new Date('2025-01-15'),
      productName: 'Sofa - Góc Hiện Đại',
      warranty_status: 'approved',
      issue_description: 'Sản phẩm bị trầy xước nhẹ ở chân gỗ.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
    },
    {
      _id: 'REQ002',
      request_date: new Date('2025-02-10'),
      productName: 'Bàn Trà Mây Thổi',
      warranty_status: 'pending',
      issue_description: 'Mặt bàn có vết nứt nhỏ.',
      image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80'
    }
  ];

  filteredRequests: any[] = [];

  constructor(
    private orderService: OrderServices,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadDeliveredOrders();
    this.updateFilteredRequests();
  }

  loadDeliveredOrders() {
    this.loadingOrders = true;
    this.orderService.getUserOrders().subscribe({
      next: (res) => {
        const orders = res.data;
        if (orders.length === 0) {
          this.deliveredOrders = [];
          this.loadingOrders = false;
          return;
        }

        const detailRequests = orders.map((order: IOrder) =>
          this.orderService.getOrderDetail(order._id).pipe(
            map((res) => ({
              ...order,
              items: res.data.items,
            }))
          )
        );

        forkJoin(detailRequests).subscribe({
          next: (ordersWithItems) => {
            // Filter only orders that have at least one delivered item
            this.deliveredOrders = (ordersWithItems as IOrderWithItems[]).filter(order =>
              order.items.some(i => i.item.status === 'delivered')
            );
            this.loadingOrders = false;
          },
          error: () => {
            this.toastService.error('Không tải được chi tiết đơn hàng');
            this.loadingOrders = false;
          },
        });
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Không tải được đơn hàng');
        this.loadingOrders = false;
      },
    });
  }

  onOrderChange() {
    const order = this.deliveredOrders.find(o => o._id === this.selectedOrderId);
    if (order) {
      this.availableProducts = order.items
        .filter(i => i.item.status === 'delivered')
        .map(i => ({
          orderId: order.order_number,
          orderDate: order.completed_at || 'N/A',
          item: i.item,
          shipping: i.shipping,
          payment: i.payment
        }));
      this.selectedProductId = '';
      this.selectedProduct = null;
    } else {
      this.availableProducts = [];
    }
  }

  onProductChange() {
    this.selectedProduct = this.availableProducts.find(p => p.item._id === this.selectedProductId) || null;
  }

  selectOrder(id: string) {
    if (this.selectedOrderId === id) {
      this.selectedOrderId = '';
      this.onOrderChange();
      return;
    }
    this.selectedOrderId = id;
    this.onOrderChange();
  }

  selectProduct(id: string) {
    if (this.selectedProductId === id) {
      this.selectedProductId = '';
      this.onProductChange();
      return;
    }
    this.selectedProductId = id;
    this.onProductChange();
  }

  setListTab(tab: string) {
    this.activeListTab = tab;
    this.updateFilteredRequests();
  }

  updateFilteredRequests() {
    if (this.activeListTab === 'all') {
      this.filteredRequests = this.sentRequests;
    } else {
      this.filteredRequests = this.sentRequests.filter(r => r.warranty_status === this.activeListTab);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImages.push({ file, url: e.target.result });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  submitWarrantyRequest() {
    if (!this.selectedProduct) {
      this.toastService.error('Vui lòng chọn sản phẩm cần bảo hành');
      return;
    }
    if (!this.agreedToTerms) {
      this.toastService.error('Vui lòng đồng ý với điều khoản');
      return;
    }

    const reasons = this.warrantyReasons.filter(r => r.checked).map(r => r.label);
    if (reasons.length === 0) {
      this.toastService.error('Vui lòng chọn ít nhất một lý do');
      return;
    }

    // Align with IWarrantyRequest interface for future backend integration
    const newRequest: Partial<IWarrantyRequest> & { productName: string, item_image: string, images?: string[] } = {
      _id: 'REQ' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      user_id: 'current_user_id', // Mock user ID
      order_id: this.selectedOrderId,
      product_variant_id: this.selectedProductId,
      request_date: new Date(),
      issue_description: this.warrantyNote || reasons.join(', '),
      warranty_method: this.warrantyMethod,
      warranty_reasons: reasons,
      warranty_status: 'pending',
      // UI-only helper fields
      productName: this.selectedProduct.item.product_name,
      item_image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
      images: this.selectedImages.map(img => img.url) // Preview images
    };

    // Mock submission to local list
    this.sentRequests.unshift(newRequest);
    this.updateFilteredRequests();
    this.toastService.success('Yêu cầu bảo hành đã được gửi thành công');

    // Reset form
    this.selectedOrderId = '';
    this.selectedProductId = '';
    this.selectedProduct = null;
    this.warrantyNote = '';
    this.agreedToTerms = false;
    this.warrantyReasons.forEach(r => r.checked = false);
    this.selectedImages = [];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối'
    };
    return map[status] ?? status;
  }
}
