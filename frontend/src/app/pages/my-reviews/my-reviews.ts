import { Component } from '@angular/core';
import { SettingsBreadcrumb } from '../../components/account-settings/settings-breadcrumb/settings-breadcrumb';

@Component({
  selector: 'app-my-reviews',
  imports: [SettingsBreadcrumb],
  templateUrl: './my-reviews.html',
  styleUrl: './my-reviews.css',
})
export class MyReviews {
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
      reviews: [
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '18/09/2025',
          is_liked: true,
        },
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '17/09/2025',
          is_liked: true,
        },
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '17/09/2025',
          is_liked: true,
        },
      ],
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
      reviews: [
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '18/09/2025',
          is_liked: true,
        },
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '17/09/2025',
          is_liked: true,
        },
        {
          user_name: 'Nguyễn Bảo Huy',
          user_email: 'huynguyen002311@gmail.com',
          user_avatar: 'user/image.png',
          content:
            'Sản phẩm chất lượng tốt, xịn máu, không đẹp như hình ảnh sản. Không đánh nổi về ngồi 2 chỗ mà xác định nóc bệu tiền. Hoàn tiền nó mới tôi nghĩ nên nữa để căng, nước tấp vô tự ăn hết Homebase có mà 1 chiếc hàng này tôi nói rõ ràng thật xui với về giao hàng nên sản đi khi giao hàng.',
          review_data: '17/09/2025',
          is_liked: true,
        },
      ],
    },
  ];
  formatNumberVN(num: number | string): string {
    const value = Number(num);
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  }
}
