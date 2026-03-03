import { Component } from '@angular/core';
import { Faq } from '../../components/home/faq/faq';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-about-us',
  imports: [Faq, CommonModule],
  standalone: true,
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  brand = {
    brand_Id: 'HB001',
    brand_name: 'HOMEBASE',
    brand_address: '123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
    contact_email: 'info@homebase.vn',
    brand_phone: '1900 1234',
  };

  stats = [
    { value: '25+', label: 'Năm Kinh Nghiệm' },
    { value: '15K+', label: 'Dự Án Đã Hoàn Thành' },
    { value: '99%', label: 'Khách Hàng Hài Lòng' },
  ];

  coreValues = [
    {
      title: 'Tâm Điểm Thiết Kế',
      description:
        'Các sản phẩm luôn bắt kịp xu hướng tối giản, thông minh, giúp tối ưu diện tích và nâng tầm thẩm mỹ.',
    },
    {
      title: 'An Toàn Tuyệt Đối',
      description:
        'Sử dụng nguồn nguyên liệu gỗ đạt chuẩn quốc tế (FSC, CARB-P2), đảm bảo nồng độ Formaldehyde ở mức an toàn nhất cho sức khỏe gia đình, đặc biệt là trẻ nhỏ.',
    },
    {
      title: 'Chất Lượng Xuất Khẩu',
      description:
        'Thừa hưởng quy trình sản xuất nghiêm ngặt và công nghệ tiên tiến, mỗi sản phẩm đều đạt tiêu chuẩn xuất khẩu sang các thị trường khó tính như Mỹ, Nhật Bản và Châu Âu.',
    },
    {
      title: 'Giá Trị Thực',
      description:
        'Tối ưu hóa quy trình từ xưởng sản xuất đến tận tay người tiêu dùng để mang lại mức giá hợp lý nhất mà không phải đánh đổi về chất lượng.',
    },
    {
      title: 'Trách Nhiệm Xanh',
      description:
        'Chúng tôi ưu tiên sử dụng vật liệu thân thiện với môi trường và bao bì tái chế, góp phần bảo vệ hành tinh xanh.',
    },
  ];

  features = [
    {
      icon: 'bi bi-truck',
      title: 'Giao hàng & Lắp đặt',
      description: 'Nhanh chóng, an toàn và chuyên nghiệp.',
    },
    {
      icon: 'bi bi-shield-check',
      title: 'Bảo hành',
      description: 'Chế độ bảo hành dài hạn, tận tâm.',
    },
    {
      icon: 'bi bi-arrow-left-right',
      title: 'Đổi trả 1-1',
      description: 'Chính sách đổi trả linh hoạt, thủ tục đơn giản.',
    },
    {
      icon: 'bi bi-headset',
      title: 'Tư vấn cá nhân hóa',
      description: 'Đội ngũ chuyên gia hỗ trợ tận tình 10-10.',
    },
  ];
}
