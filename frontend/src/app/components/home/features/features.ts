import { Component } from '@angular/core';

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.html',
  styleUrl: './features.css',
})
export class Features {
  child_data: any = {
    category_product: [
      {
        category_id: 1,
        category_name: 'Sofa & Ghế',
        quantity: 120,
        image_url:
          'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/belge_arezzon_fabric_3331/main/image.png',
      },
      {
        category_id: 2,
        category_name: 'Bàn',
        quantity: 85,
        image_url:
          'images/products/dinning_room/kingston_dining_table/h29_w39_l63/table_dark_oak_veneer/leg_matt_black_lacquered/main/image.png',
      },
      {
        category_id: 3,
        category_name: 'Tủ & Kệ',
        quantity: 95,
        image_url:
          'images/products/bedroom/lugano_nightstand/cabinet_matte_ash_gray_lacquered/leg_ash_gray_lacquered/main/image.png',
      },
      {
        category_id: 4,
        category_name: 'Giường ngủ',
        quantity: 120,
        image_url: 'images/products/bedroom/bolzano_bed/red_lucca_fabric_3323/main/image.png',
      },
      {
        category_id: 5,
        category_name: 'Vật dụng trang trí',
        quantity: 45,
        image_url: 'images/products/bathroom/whirlwind_rug/w67_l94/main/image.png',
      },
    ],
    rooms: [
      {
        category_name: 'Phòng khách',
      },
      {
        category_name: 'Phòng ngủ',
      },
      {
        category_name: 'Phòng ăn',
      },
      {
        category_name: 'Văn phòng',
      },
      {
        category_name: 'Trang trí',
      },
      {
        category_name: 'Phụ kiện',
      },
    ],
  };
  errMsg: string = '';
}
