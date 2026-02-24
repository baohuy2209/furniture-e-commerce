import { Component, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as productData from '../../../assets/data/product.json';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  notification = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  showToast(msg: string, type: 'success' | 'error') {
    this.notification.set({ msg, type });
    setTimeout(() => this.notification.set(null), 3000);
  }
  searchQuery = signal('');
  activeTab = signal('waiting');

  // allOrders = signal<any[]>([
  //   {
  //     orderId: 'HB-99201',
  //     orderDate: '12/02/2026',
  //     status: 'waiting',
  //     statusText: 'Chờ xác nhận',
  //     paymentMethod: 'Chuyển khoản',
  //     address: 'Số 10, Đường 3/2, Quận 10, TP. HCM',
  //     isExpanded: false,
  //     currentImageIndex: 0, // Theo dõi ảnh hiện tại của sản phẩm chính trong order này
  //     items: [
  //       {
  //         id: 'it-1',
  //         name: 'Sofa Góc Hiện Đại Mây & Da',
  //         imageGallery: [
  //           'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image1.png',
  //           'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image2.png',
  //           'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image3.png',
  //         ],
  //         color: 'Beige',
  //         material: 'Gỗ Sồi',
  //         price: 20890000,
  //         qty: 1,
  //         discount: 2000000,
  //       },
  //       {
  //         // Item phụ trong cùng đơn hàng
  //         id: 'it-1-1',
  //         name: 'Bàn Trà Kính Cường Lực',
  //         imageGallery: ['images/products/living_room/stockholm_table_lamp/image1.png'],
  //         color: 'Trong suốt',
  //         material: 'Kính',
  //         price: 5500000,
  //         qty: 1,
  //         discount: 0,
  //       },
  //     ],
  //   },
  //   {
  //     orderId: 'HB-99202',
  //     orderDate: '13/02/2026',
  //     status: 'waiting',
  //     statusText: 'Chờ xác nhận',
  //     paymentMethod: 'Tiền mặt',
  //     address: 'Phường 26, Bình Thạnh, TP. HCM',
  //     isExpanded: false,
  //     currentImageIndex: 0,
  //     items: [
  //       {
  //         id: 'it-2',
  //         name: 'Bàn cà phê Cancun',
  //         imageGallery: [
  //           'images/products/outdoor/cancun_coffee_table/image1.png',
  //           'images/products/outdoor/cancun_coffee_table/image2.png',
  //         ],
  //         color: 'Trắng',
  //         material: 'Kim loại',
  //         price: 5000000,
  //         qty: 1,
  //         discount: 500000,
  //       },
  //       {
  //         // Item phụ trong cùng đơn hàng
  //         id: 'it-2-1',
  //         name: 'Ghế Bành Thư Giãn',
  //         imageGallery: ['images/products/living_room/lounge_chair/image1.png'], // Cập nhật ảnh mẫu
  //         color: 'Xám',
  //         material: 'Vải',
  //         price: 7200000,
  //         qty: 2,
  //         discount: 1000000,
  //       },
  //     ],
  //   },
  //   {
  //     orderId: 'HB-88123',
  //     orderDate: '10/01/2026',
  //     status: 'shipping',
  //     statusText: 'Chờ giao hàng',
  //     paymentMethod: 'Ví điện tử',
  //     address: 'Quận 1, TP. HCM',
  //     isExpanded: false,
  //     currentImageIndex: 0,
  //     items: [
  //       {
  //         id: 'it-3',
  //         name: 'Đèn sàn Stockholm',
  //         imageGallery: ['images/products/living_room/stockholm_table_lamp/image1.png'],
  //         color: 'Đen',
  //         material: 'Thép',
  //         price: 3200000,
  //         qty: 1,
  //         discount: 0,
  //       },
  //     ],
  //   },
  //   {
  //     orderId: 'HB-88124',
  //     orderDate: '15/01/2026',
  //     status: 'shipping',
  //     statusText: 'Chờ giao hàng',
  //     paymentMethod: 'Thẻ tín dụng',
  //     address: 'Quận 7, TP. HCM',
  //     isExpanded: false,
  //     currentImageIndex: 0,
  //     items: [
  //       {
  //         id: 'it-4',
  //         name: 'Kệ Sách Gỗ Tự Nhiên',
  //         imageGallery: ['images/products/bedroom_room/como_bookcase/image1.png'], // Cập nhật ảnh mẫu
  //         color: 'Nâu',
  //         material: 'Gỗ Sồi',
  //         price: 8900000,
  //         qty: 1,
  //         discount: 0,
  //       },
  //     ],
  //   },
  //   {
  //     orderId: 'HB-77001',
  //     orderDate: '01/12/2025',
  //     status: 'received',
  //     statusText: 'Đã nhận',
  //     paymentMethod: 'Tiền mặt',
  //     address: 'Đường Nguyễn Văn Linh, Đà Nẵng',
  //     isExpanded: false,
  //     currentImageIndex: 0,
  //     items: [
  //       {
  //         id: 'it-5',
  //         name: 'Bàn Ăn Đá Marble',
  //         imageGallery: ['images/products/dining_room/augusta_extendable_dining_table/image1.png'], // Cập nhật ảnh mẫu
  //         color: 'Trắng vân',
  //         material: 'Đá Marble',
  //         price: 15000000,
  //         qty: 1,
  //         discount: 500000,
  //       },
  //     ],
  //   },
  // ]);

  allOrders = signal<any[]>([]);

  constructor() {
    this.generateSampleOrders();
  }

  private generateSampleOrders(): void {
    const products: any[] = (productData as any).default;

    if (!products || products.length === 0) {
      console.warn('Không tìm thấy dữ liệu sản phẩm trong product.json hoặc file rỗng.');
      return;
    }

    const numOrders = 5;
    const sampleOrders: any[] = [];

    for (let i = 0; i < numOrders; i++) {
      // Mỗi đơn hàng bây giờ sẽ có nhiều hơn 1 sản phẩm (items) để điều hướng
      const numItemsInOrder = Math.floor(Math.random() * 3) + 1; // 1 đến 3 sản phẩm trong 1 đơn hàng
      const orderItems: any[] = [];

      for (let j = 0; j < numItemsInOrder; j++) {
        const randomProductIndex = Math.floor(Math.random() * products.length);
        const randomProduct = products[randomProductIndex];

        if (!randomProduct || !randomProduct.image_url || randomProduct.image_url.length === 0) {
          console.warn(`Sản phẩm với ID ${randomProduct?.product_id} không có URL ảnh. Bỏ qua.`);
          continue;
        }

        orderItems.push({
          id: randomProduct.product_id,
          name: randomProduct.product_name,
          // imageGallery sẽ chứa TẤT CẢ CÁC ẢNH CỦA SẢN PHẨM ĐÓ
          imageGallery: randomProduct.image_url,
          color: randomProduct.product_component?.color?.[0] || 'N/A',
          material: randomProduct.product_component?.ulphostery?.[0] || 'N/A',
          price: Math.floor(Math.random() * 10000000) + 1000000,
          qty: Math.floor(Math.random() * 3) + 1,
          discount: Math.floor(Math.random() * 500000),
        });
      }

      if (orderItems.length === 0) {
        // Đảm bảo có ít nhất 1 sản phẩm trong đơn hàng
        continue;
      }

      sampleOrders.push({
        orderId: `HB-${Math.floor(Math.random() * 90000) + 10000}`,
        orderDate: `1${Math.floor(Math.random() * 9)}/02/2026`,
        status: ['waiting', 'shipping', 'received', 'returned', 'cancelled'][
          Math.floor(Math.random() * 5)
        ],
        statusText: {
          waiting: 'Chờ xác nhận',
          shipping: 'Chờ giao hàng',
          received: 'Đã nhận',
          returned: 'Đã trả',
          cancelled: 'Đã hủy',
        }[
          ['waiting', 'shipping', 'received', 'returned', 'cancelled'][
            Math.floor(Math.random() * 5)
          ]
        ],
        paymentMethod: ['Chuyển khoản', 'Tiền mặt', 'Ví điện tử', 'Thẻ tín dụng'][
          Math.floor(Math.random() * 4)
        ],
        address: [
          'Số 10, Đường 3/2, Quận 10, TP. HCM',
          'Phường 26, Bình Thạnh, TP. HCM',
          'Quận 1, TP. HCM',
          'Đường Nguyễn Văn Linh, Đà Nẵng',
        ][Math.floor(Math.random() * 4)],
        isExpanded: false,
        currentImageIndex: 0, // <-- Giờ đây là index của SẢN PHẨM đang hiển thị trong mảng 'items'
        items: orderItems, // Đơn hàng có thể chứa nhiều sản phẩm
      });
    }
    this.allOrders.set(sampleOrders);
  }

  filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tab = this.activeTab();
    return this.allOrders().filter(
      (o) =>
        o.status === tab &&
        (o.orderId.toLowerCase().includes(q) ||
          o.items.some((i: any) => i.name.toLowerCase().includes(q))),
    );
  });

  // Tính tổng số đơn hàng trong tab  hiện tại (để hiển thị "X/Y")
  totalOrdersInTab = computed(() => this.filteredOrders().length);

  changeMainProductImage(order: any, direction: number): void {
    if (!order.items || order.items.length <= 1) {
      // Không có gì để điều hướng nếu chỉ có 1 sản phẩm
      return;
    }

    let newIndex = order.currentImageIndex + direction;
    const totalItems = order.items.length;

    if (newIndex < 0) {
      newIndex = totalItems - 1; // Quay lại sản phẩm cuối
    } else if (newIndex >= totalItems) {
      newIndex = 0; // Chuyển đến sản phẩm đầu tiên
    }
    order.currentImageIndex = newIndex;
  }

  calculateTotal(order: any) {
    // Đảm bảo tính toán đúng khi có nhiều items
    return order.items.reduce((s: number, i: any) => s + (i.price * i.qty - i.discount), 0);
  }

  // Hàm hiển thị thông báo Toast (từ trang Hỗ trợ)
  markAsReceived(order: any) {
    if (order.status === 'waiting') {
      // CHỈ XỬ LÝ CHO "CHỜ XÁC NHẬN"
      order.status = 'received';
      order.statusText = 'Đã nhận';
      this.showToast('Xác nhận đã nhận hàng thành công!', 'success');

      // Sau khi chuyển trạng thái, cập nhật lại mảng allOrders
      this.allOrders.update((orders) => {
        return orders.map((o) =>
          o.orderId === order.orderId ? { ...o, status: 'received', statusText: 'Đã nhận' } : o,
        );
      });

      return; // Chấm dứt để không chạy tiếp các if khác
    }
    if (order.status === 'shipping') {
      // CHỈ XỬ LÝ CHO "CHỜ giao hàng"
      order.status = 'received';
      order.statusText = 'Đã nhận';
      this.showToast('Xác nhận đã nhận hàng thành công!', 'success');

      // Sau khi chuyển trạng thái, cập nhật lại mảng allOrders
      this.allOrders.update((orders) => {
        return orders.map((o) =>
          o.orderId === order.orderId ? { ...o, status: 'received', statusText: 'Đã nhận' } : o,
        );
      });

      return; // Chấm dứt để không chạy tiếp các if khác
    }

    this.showToast('Không thể thực hiện hành động này!', 'error'); // Báo lỗi nếu trạng thái không hợp lệ
  }

  buyAgain(order: any) {
  // Ở đây Huy có thể thêm logic chuyển sang trang thanh toán hoặc thêm vào giỏ hàng
  this.showToast('Sản phẩm đã được thêm lại vào giỏ hàng!', 'success');
}
}

