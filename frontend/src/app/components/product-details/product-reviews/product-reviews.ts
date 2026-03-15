import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
export interface ReviewSummary {
  average: number;
  total: number;
  distribution: { star: number; count: number }[];
}

export interface Review {
  _id?: string;
  username: string;
  avatar?: string;
  totalReviews: number;
  rating: number;
  comments: string;
  images?: string[];
  timeAgo: string;
}
@Component({
  selector: 'app-product-reviews',
  imports: [CommonModule],
  templateUrl: './product-reviews.html',
  styleUrl: './product-reviews.css',
  standalone: true,
})
export class ProductReviews {
  @Input() summary: ReviewSummary = {
    average: 4.8,
    total: 100,
    distribution: [
      { star: 5, count: 78 },
      { star: 4, count: 12 },
      { star: 3, count: 6 },
      { star: 2, count: 3 },
      { star: 1, count: 1 },
    ],
  };

  @Input() reviews: Review[] = [
    {
      username: 'Xhin22',
      avatar: 'https://i.pravatar.cc/150?img=47',
      totalReviews: 1,
      rating: 5,
      comments:
        'Đây là chiếc sofa đầu tiên và duy nhất tôi đặt mua trên HomeBase, và tôi thực sự rất hài lòng! Tôi đã yêu cầu thiết kế sofa theo ý riêng, dựa trên hai tông màu tôi yêu thích, và kết quả thật tuyệt vời. Cảm giác thoải mái và niềm vui chân thật mà chiếc sofa này mang lại thật khó diễn tả — vừa tinh tế, vừa gần gũi.',
      images: [
        'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300&q=80',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80',
      ],
      timeAgo: '1 tháng trước',
    },
    {
      username: 'MinhTuan',
      totalReviews: 3,
      rating: 4.5,
      comments:
        'Chất lượng vải rất tốt, đóng gói cẩn thận. Giao hàng nhanh hơn dự kiến. Màu sắc thực tế đẹp hơn trên ảnh sản phẩm.',
      timeAgo: '2 tháng trước',
    },
    {
      username: 'LinhNguyen',
      avatar: 'https://i.pravatar.cc/150?img=32',
      totalReviews: 7,
      rating: 5,
      comments:
        'Sofa đẹp lắm, ngồi cực kỳ thoải mái. Gia đình tôi ai cũng khen. Sẽ giới thiệu cho bạn bè!',
      images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=300&q=80'],
      timeAgo: '3 tháng trước',
    },
  ];

  lightboxImage: string | null = null;

  ngOnInit(): void {}

  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  getBarPercent(count: number): number {
    const max = Math.max(...this.summary.distribution.map((d) => d.count));
    return max === 0 ? 0 : Math.round((count / max) * 100);
  }

  getInitials(name: string): string {
    return name.slice(0, 2).toUpperCase();
  }

  openImage(url: string): void {
    this.lightboxImage = url;
  }

  closeLightbox(): void {
    this.lightboxImage = null;
  }
}
