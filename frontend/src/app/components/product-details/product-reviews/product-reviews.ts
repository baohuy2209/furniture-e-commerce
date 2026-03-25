import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IReview, IUser } from '../../../../interface';
import { formatDate } from '../../../utils/utils';
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
  @Input() summary!: ReviewSummary;
  // {
  //   average: 4.8,
  //   total: 100,
  //   distribution: [
  //     { star: 5, count: 78 },
  //     { star: 4, count: 12 },
  //     { star: 3, count: 6 },
  //     { star: 2, count: 3 },
  //     { star: 1, count: 1 },
  //   ],
  // };

  @Input() reviews!: (Omit<IReview, 'user_id'> & { user_id: IUser })[];

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
  formatDateTime(date: Date | string) {
    return formatDate(date);
  }
}
