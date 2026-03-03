import { Component } from '@angular/core';
interface PolicySection {
  id: string;
  title: string;
  isOpen: boolean;
  content?: string[]; // Array of paragraphs or bullet points
}
@Component({
  selector: 'app-policy',
  imports: [],
  templateUrl: './policy.html',
  styleUrl: './policy.css',
  standalone: true,
})
export class Policy {
  sections: PolicySection[] = [
    {
      id: 'I',
      title: 'Điều khoản sử dụng (Terms of Use)',
      isOpen: true,
      content: [
        '1. Chấp nhận điều khoản: Người dùng xác nhận rằng việc tiếp tục truy cập, sử dụng website hoặc thực hiện giao dịch mua hàng đồng nghĩa với việc đồng ý tuân thủ các điều khoản sử dụng. Nếu không đồng ý, người dùng vui lòng ngừng sử dụng website.',
        '2. Sửa đổi và cập nhật điều khoản: Website có quyền chỉnh sửa, bổ sung hoặc cập nhật nội dung điều khoản bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải. Người dùng có trách nhiệm theo dõi thường xuyên để cập nhật thông tin mới nhất.',
        '3. Tài khoản người dùng:',
        '- Người dùng phải cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản.',
        '- Người dùng tự chịu trách nhiệm bảo mật thông tin đăng nhập.',
        '- Mọi hoạt động phát sinh từ tài khoản được xem là hành vi của chủ tài khoản.',
        '- Website có quyền khóa tài khoản vi phạm quy định hoặc có dấu hiệu gian lận.',
        '4. Quy định về hành vi sử dụng:',
        '- Can thiệp vào hệ thống, gây cản trở hoạt động của website.',
        '- Đăng tải nội dung sai lệch, độc hại, vi phạm pháp luật.',
        '- Thu thập thông tin người dùng khác trái phép.',
        '- Sử dụng nội dung website cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.',
        '5. Quyền sở hữu trí tuệ: Toàn bộ hình ảnh sản phẩm, thiết kế, mô tả kỹ thuật, nội dung, logo và dữ liệu trên website thuộc quyền sở hữu của Công ty. Mọi hành vi sao chép, tái sử dụng hoặc phân phối trái phép đều bị nghiêm cấm.',
        '6. Liên kết với bên thứ ba: Website có thể chứa liên kết tới trang của đối tác. Nội dung tại các liên kết này không thuộc phạm vi kiểm soát của Công ty, do đó Công ty không chịu trách nhiệm về rủi ro, thiệt hại phát sinh khi người dùng truy cập các liên kết đó.',
      ],
    },
    {
      id: 'II',
      title: 'Chính sách bảo mật (Privacy Policy)',
      isOpen: false,
      content: [
        'Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng. Thông tin thu thập được chỉ sử dụng cho mục đích xử lý đơn hàng, cải thiện dịch vụ và gửi thông tin khuyến mãi (nếu khách hàng đăng ký).',
        'Chúng tôi không chia sẻ thông tin khách hàng với bên thứ ba trừ khi có yêu cầu của cơ quan pháp luật hoặc đơn vị vận chuyển để giao hàng.',
      ],
    },
    {
      id: 'III',
      title: 'Chính sách đổi trả (Return & Refund Policy)',
      isOpen: false,
      content: [
        'Khách hàng có quyền đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi do nhà sản xuất hoặc hư hỏng trong quá trình vận chuyển.',
        'Sản phẩm đổi trả phải còn nguyên vẹn, đầy đủ phụ kiện và bao bì gốc. Vui lòng liên hệ bộ phận CSKH để được hướng dẫn quy trình đổi trả chi tiết.',
      ],
    },
    {
      id: 'IV',
      title: 'Chính sách giao hàng (Shipping Policy)',
      isOpen: false,
      content: [
        'Chúng tôi hỗ trợ giao hàng toàn quốc. Thời gian giao hàng dự kiến từ 3-5 ngày làm việc tùy khu vực.',
        'Miễn phí vận chuyển cho đơn hàng có giá trị trên 5.000.000 VNĐ. Đối với các đơn hàng khác, phí vận chuyển sẽ được tính dựa trên trọng lượng và địa chỉ nhận hàng.',
      ],
    },
    {
      id: 'V',
      title: 'Chính sách bảo hành (Warranty Policy)',
      isOpen: false,
      content: [
        'Tất cả sản phẩm nội thất đều được bảo hành chính hãng từ 12 đến 24 tháng tùy loại sản phẩm.',
        'Bảo hành bao gồm các lỗi kỹ thuật, kết cấu sản phẩm. Không bảo hành các lỗi do người sử dụng gây ra như va đập, trầy xước, để sản phẩm tiếp xúc với hóa chất hoặc môi trường khắc nghiệt.',
      ],
    },
    {
      id: 'VI',
      title: 'Chính sách thanh toán (Payment Policy)',
      isOpen: false,
      content: [
        'Chúng tôi chấp nhận các hình thức thanh toán đa dạng: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng, Thẻ tín dụng/ghi nợ (Visa, Mastercard), và các ví điện tử phổ biến.',
        'Thông tin thanh toán của khách hàng được bảo mật tuyệt đối theo tiêu chuẩn an ninh mạng.',
      ],
    },
    {
      id: 'VII',
      title: 'Điều khoản về giá & khuyến mãi',
      isOpen: false,
      content: [
        'Giá sản phẩm niêm yết trên website đã bao gồm thuế VAT nhưng chưa bao gồm phí vận chuyển.',
        'Các chương trình khuyến mãi có thể thay đổi hoặc kết thúc sớm hơn dự kiến tùy thuộc vào số lượng quà tặng hoặc chính sách của công ty.',
      ],
    },
    {
      id: 'VIII',
      title: 'Điều khoản giải quyết tranh chấp',
      isOpen: false,
      content: [
        'Mọi tranh chấp phát sinh trong quá trình giao dịch sẽ được giải quyết trên tinh thần thương lượng và hòa giải.',
        'Trong trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án có thẩm quyền tại TP.HCM để giải quyết theo quy định của pháp luật Việt Nam.',
      ],
    },
  ];

  toggleSection(index: number) {
    // Accordion behavior: close others, toggle clicked
    const currentState = this.sections[index].isOpen;
    this.sections.forEach((s) => (s.isOpen = false));
    this.sections[index].isOpen = !currentState;
  }
}
