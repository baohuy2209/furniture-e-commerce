import { Component } from '@angular/core';
import { SettingsBreadcrumb } from '../../components/account-settings/settings-breadcrumb/settings-breadcrumb';

@Component({
  selector: 'app-my-orders',
  imports: [SettingsBreadcrumb],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  list_orders = [
    {
      order_number: '1',
      image_url:
        'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/belge_arezzon_fabric_3331/main/image.png',
      product_name: 'Hammpton conrner sofa with adjustable back and storage on left side',
      description: 'Chất liệu: Gỗ cao cấp kết hợp vải hiện đại',
      sku: '4415165AK003331',
      status: 'preparing',
      quantity: 1,
      price: 208890000,
      discount_total: 1000000,
      total_shipping_fee: 0,
      payment_status: 'unpaid',
      note: 'Hàng dễ vỡ, cẩn thận khi vận chuyển',
      cancel_reason: '',
      created_at: '15/11/2025',
      payment_method: 'Tiền mặt',
      location: 'Phường 26, quận Bình Thạnh, Tp. Hồ Chí Minh',
      is_choose: true,
    },
    {
      order_number: '2',
      image_url: 'images/products/living_room/belize_coral_sculpture/main/image.png',
      product_name: 'Vật trang trí Belize',
      description: 'Trang hoàn phòng khách',
      sku: '104011032910',
      status: 'preparing',
      quantity: 2,
      price: 16890000,
      discount_total: 100000,
      total_shipping_fee: 0,
      total_amount: 1650000,
      payment_status: 'unpaid',
      note: 'Hàng dễ vỡ, cẩn thận khi vận chuyển',
      cancel_reason: '',
      created_at: '14/11/2025',
      payment_method: 'Tiền mặt',
      location: 'hẻm 300, đường Nguyễn Tri Phương, Bình Dương',
      is_choose: true,
    },
  ];
  getOrderByStatus(status: string) {
    return this.list_orders.filter((order) => (order.status = status));
  }
  getAllOrderChosen() {
    return this.list_orders.filter((order) => order.is_choose == true);
  }
  getTotalMoneyOrderChosen() {
    const orders_chosen = this.getAllOrderChosen();
    let sum = 0;
    orders_chosen.forEach((order) => {
      sum += order.price * order.quantity;
    });
    return sum;
  }
  getTotalShippingFeeOrderChosen() {
    const orders_chosen = this.getAllOrderChosen();
    let sum = 0;
    orders_chosen.forEach((order) => {
      sum += order.total_shipping_fee;
    });
    return sum;
  }
  getTotalDiscountOrderChosen() {
    const orders_chosen = this.getAllOrderChosen();
    let sum = 0;
    orders_chosen.forEach((order) => {
      sum += order.discount_total;
    });
    return sum;
  }
  formatNumberVN(num: number | string): string {
    const value = Number(num);
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  }
  getOrderByOrderNumber(order_number: string) {
    return this.list_orders.filter((order) => (order.order_number = order_number)).length == 0
      ? ''
      : this.list_orders.filter((order) => (order.order_number = order_number))[0];
  }
  chooseOrder(order_number: string) {}
}
