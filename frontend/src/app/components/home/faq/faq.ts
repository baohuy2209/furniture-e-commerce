import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq {
  faqItems: FaqItem[] = [
    {
      question: 'HomeBase cung cấp những loại sản phẩm nào?',
      answer: 'HomeBase cung cấp đa dạng sản phẩm nội thất cao cấp bao gồm: sofa, ghế, bàn, giường, tủ, kệ, đèn trang trí và các phụ kiện trang trí từ các thương hiệu uy tín trong và ngoài nước.',
      isOpen: true // First item open by default
    },
    {
      question: 'HomeBase có chương trình khuyến mãi nào không?',
      answer: 'Chúng tôi thường xuyên có các chương trình khuyến mãi theo mùa, sự kiện đặc biệt và ưu đãi cho thành viên thân thiết. Hãy đăng ký nhận tin quyêt để không bỏ lỡ!',
      isOpen: false
    },
    {
      question: 'Làm thế nào để gửi phản hồi về trải nghiệm?',
      answer: 'Bạn có thể gửi phản hồi trực tiếp qua trang Liên Hệ, gửi email đến support@homebase.vn hoặc gọi hotline của chúng tôi. Chúng tôi luôn trân trọng mọi ý kiến đóng góp.',
      isOpen: false
    },
    {
      question: 'HomeBase có dịch vụ chăm sóc khách hàng không?',
      answer: 'Có, đội ngũ chăm sóc khách hàng của chúng tôi hoạt động 24/7 để hỗ trợ giải đáp thắc mắc, tư vấn sản phẩm và xử lý các vấn đề sau mua hàng.',
      isOpen: false
    },
    {
      question: 'Làm thế nào để theo dõi đơn hàng của tôi?',
      answer: 'Bạn có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản, chọn mục "Đơn hàng của tôi" hoặc nhập mã vận đơn tại trang Tra Cứu Đơn Hàng.',
      isOpen: false
    }
  ];

  toggleFaq(index: number) {
    // Option 1: Allow multiple open
    // this.faqItems[index].isOpen = !this.faqItems[index].isOpen;

    // Option 2: Accordion style (only one open at a time)
    const currentState = this.faqItems[index].isOpen;
    
    // Close all
    this.faqItems.forEach(item => item.isOpen = false);

    // Toggle clicked item (if it was closed, open it; if it was open, leave it closed)
    this.faqItems[index].isOpen = !currentState;
  }
}
