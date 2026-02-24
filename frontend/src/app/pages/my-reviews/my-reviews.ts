// src/app/pages/my-reviews/my-reviews.ts

import { Component, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Thêm DecimalPipe để định dạng tiền tệ
import { FormsModule } from '@angular/forms'; // Cần nếu có input search hoặc checkbox

// Có thể import productData nếu bạn muốn tạo đánh giá ngẫu nhiên từ sản phẩm
// import * as productData from '../../../assets/data/product.json';


@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe], // Đảm bảo có DecimalPipe
  templateUrl: './my-reviews.html',
  styleUrl: './my-reviews.css'
})
export class MyReviews {
  searchQuery = signal('');
  selectedReviewIds = signal<string[]>([]);
  selectedImagePreview = signal<string | null>(null);

  // Thông tin user "Nguyễn Bảo Huy"
  currentUser = {
    firstName: 'Nguyễn Bảo',
    lastName: 'Huy',
    username: 'nguyenbaohuy2311', // Tên đăng nhập để hiển thị
    avatar: 'assets/images/user-profile-avatar.png', // Sử dụng avatar đã có
  };

  // Dữ liệu đánh giá mẫu
  allReviews = signal([
    {
      reviewId: 'rv-001',
      productId: 'it-1',
      productName: 'Sofa Góc Hiện Đại Mây & Da',
      productImage: 'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image1.png',
      productColor: 'Beige',
      productMaterial: 'Gỗ Sồi',
      productPrice: 19990000,
      productDiscount: 100000,
      // NỘI DUNG BÌNH LUẬN GIẢ LẬP CỦA NGUYỄN BẢO HUY
      reviewText: 'Bộ sofa này thực sự vượt xa mong đợi của tôi! Chất liệu vải êm ái, khung gỗ sồi chắc chắn, ngồi rất thoải mái. Thiết kế hiện đại nhưng vẫn giữ được nét sang trọng, làm bừng sáng cả phòng khách. Giao hàng nhanh và đóng gói cẩn thận. Rất hài lòng với Homebase!',
      reviewImages: [
        'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image1.png',
        'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image2.png'
      ],
      rating: 5, // Đánh giá 5 sao
      reviewDate: '13/09/2025',
      authorName: this.currentUser.firstName + ' ' + this.currentUser.lastName,
      authorUsername: '@' + this.currentUser.username,
      authorAvatar: this.currentUser.avatar,
    },
    {
      reviewId: 'rv-002',
      productId: 'it-2',
      productName: 'Expose Side Table',
      productImage: 'images/products/living_room/expose_side_table/image1.png',
      productColor: 'Black',
      productMaterial: 'N/A',
      productPrice: 5000000, // Giá giả định cho khớp với mockup
      productDiscount: 100000, // Khuyến mãi giả định
      reviewText: 'Bàn Expose Side Table có thiết kế rất độc đáo và tinh tế, phù hợp với mọi không gian hiện đại. Màu đen sang trọng, chất liệu bền đẹp. Là điểm nhấn hoàn hảo cho góc phòng khách hoặc cạnh sofa. Mặc dù nhỏ gọn nhưng rất tiện dụng. Highly recommend!',
      reviewImages: [
        'images/products/living_room/expose_side_table/image1.png'
      ],
      rating: 4,
      reviewDate: '15/09/2025',
      authorName: this.currentUser.firstName + ' ' + this.currentUser.lastName,
      authorUsername: '@' + this.currentUser.username,
      authorAvatar: this.currentUser.avatar,
    },
  ]);

  // Bộ lọc đánh giá dựa trên search query
  filteredReviews = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.allReviews().filter(
      (review) =>
        review.productName.toLowerCase().includes(q) ||
        review.reviewText.toLowerCase().includes(q) ||
        review.reviewId.toLowerCase().includes(q)
    );
  });

  totalReviews = computed(() => this.filteredReviews().length);

  // Logic chọn tất cả và xóa
  isAllSelected = computed(() => {
    const total = this.filteredReviews().length;
    return total > 0 && this.selectedReviewIds().length === total;
  });

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedReviewIds.set(this.filteredReviews().map((r) => r.reviewId));
    } else {
      this.selectedReviewIds.set([]);
    }
  }

  toggleReview(id: string) {
    const current = this.selectedReviewIds();
    this.selectedReviewIds.set(current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  }

  deleteSelectedReviews() {
    const selected = this.selectedReviewIds();
    this.allReviews.update((reviews) => reviews.filter((r) => !selected.includes(r.reviewId)));
    this.selectedReviewIds.set([]);
  }

  // Hàm tạo mảng sao cho hiển thị rating
  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  openImagePreview(url: string) {
  this.selectedImagePreview.set(url);
}

closeImagePreview() {
  this.selectedImagePreview.set(null);
}
}