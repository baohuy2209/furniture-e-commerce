import { ChangeDetectorRef, Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Thêm DecimalPipe để định dạng tiền tệ
import { FormsModule } from '@angular/forms'; // Cần nếu có input search hoặc checkbox
import { ReviewService } from '../../services/review-service';
import { UserService } from '../../services/user-service';
import { ToastService } from '../../services/toast-service';
import {
  IOrder,
  IOrderItem,
  IOrderItemShipping,
  IPayment,
  Iproduct,
  IReview,
  IUser,
} from '../../../interface';
import { OrderServices } from '../../services/order-services';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { formatDate } from '../../utils/utils';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-my-reviews',
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink],
  standalone: true,
  templateUrl: './my-reviews.html',
  styleUrl: './my-reviews.css',
})
export class MyReviews implements OnInit {
  searchQuery = signal('');
  selectedReviewIds = signal<string[]>([]);
  selectedImagePreview = signal<string | null>(null);
  constructor(
    private reviewService: ReviewService,
    private userService: UserService,
    private toastService: ToastService,
    private orderServices: OrderServices,
    private cdr: ChangeDetectorRef,
  ) {}
  //   {
  //     reviewId: 'rv-001',
  //     productId: 'it-1',
  //     productName: 'Sofa Góc Hiện Đại Mây & Da',
  //     productImage:
  //       'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image1.png',
  //     productColor: 'Beige',
  //     productMaterial: 'Gỗ Sồi',
  //     productPrice: 19990000,
  //     productDiscount: 100000,
  //     // NỘI DUNG BÌNH LUẬN GIẢ LẬP CỦA NGUYỄN BẢO HUY
  //     reviewText:
  //       'Bộ sofa này thực sự vượt xa mong đợi của tôi! Chất liệu vải êm ái, khung gỗ sồi chắc chắn, ngồi rất thoải mái. Thiết kế hiện đại nhưng vẫn giữ được nét sang trọng, làm bừng sáng cả phòng khách. Giao hàng nhanh và đóng gói cẩn thận. Rất hài lòng với Homebase!',
  //     reviewImages: [
  //       'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image1.png',
  //       'images/products/living_room/hampton_corner_sofa_with_adjustable_back_and_storage_on_left_side/image2.png',
  //     ],
  //     rating: 5, // Đánh giá 5 sao
  //     reviewDate: '13/09/2025',
  //     authorName: this.currentUser.firstName + ' ' + this.currentUser.lastName,
  //     authorUsername: '@' + this.currentUser.username,
  //     authorAvatar: this.currentUser.avatar,
  //   },
  //   {
  //     reviewId: 'rv-002',
  //     productId: 'it-2',
  //     productName: 'Expose Side Table',
  //     productImage: 'images/products/living_room/expose_side_table/image1.png',
  //     productColor: 'Black',
  //     productMaterial: 'N/A',
  //     productPrice: 5000000, // Giá giả định cho khớp với mockup
  //     productDiscount: 100000, // Khuyến mãi giả định
  //     reviewText:
  //       'Bàn Expose Side Table có thiết kế rất độc đáo và tinh tế, phù hợp với mọi không gian hiện đại. Màu đen sang trọng, chất liệu bền đẹp. Là điểm nhấn hoàn hảo cho góc phòng khách hoặc cạnh sofa. Mặc dù nhỏ gọn nhưng rất tiện dụng. Highly recommend!',
  //     reviewImages: ['images/products/living_room/expose_side_table/image1.png'],
  //     rating: 4,
  //     reviewDate: '15/09/2025',
  //     authorName: this.currentUser.firstName + ' ' + this.currentUser.lastName,
  //     authorUsername: '@' + this.currentUser.username,
  //     authorAvatar: this.currentUser.avatar,
  //   },
  // ]);
  userOrderItems: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[] = [];
  userOrders: IOrder[] = [];
  currentUserInfo: IUser | null = null;
  error: string = '';
  allUserReviews = signal<
    (Omit<IReview, 'product_id'> & { product_id: Iproduct; orderItem: IOrderItem })[]
  >([]);
  ngOnInit(): void {
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        if (!res.data) {
          this.error = 'Không tìm thấy thông tin người dùng';
          this.cdr.detectChanges();
        }
        this.currentUserInfo = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy thông tin người dùng ';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
    this.orderServices
      .getUserOrders()
      .pipe(
        switchMap((res) => {
          if (!res.data || res.data.length === 0) {
            this.error = 'Không tìm thấy đơn hàng';
            this.toastService.error(this.error);
            return of([]); // trả về rỗng để không crash
          }

          this.userOrders = res.data;

          // 👉 tạo list observable
          const orderDetailRequests = res.data.map((order) =>
            this.orderServices.getOrderDetail(order._id),
          );

          // 👉 gọi song song
          return forkJoin(orderDetailRequests);
        }),

        map((orderDetailsResponses) => {
          // 👉 flatten + map đúng type
          const allItems = orderDetailsResponses.flatMap((res) =>
            res.data.items.map((item) => ({
              ...item,
            })),
          );

          this.userOrderItems = allItems;

          return true;
        }),

        // 👉 gọi tiếp reviews
        switchMap(() => this.reviewService.getReviewsByUser()),

        map((res) => {
          if (!res.data) return [];

          const listReview = res.data
            .map((review) => {
              const found = this.userOrderItems.find(
                (oi) => oi.item._id === review.order_item_id, // 🔥 FIX BUG (===)
              );

              if (!found) return null;

              return {
                ...review,
                orderItem: found.item,
              };
            })
            .filter(Boolean);

          return listReview;
        }),

        catchError((err) => {
          if ([400, 401, 404].includes(err.status)) {
            this.error = err.error?.message || 'Lỗi dữ liệu';
          } else {
            this.error = 'Lỗi server';
          }
          this.toastService.error(this.error);
          return of([]);
        }),
      )
      .subscribe((listReview) => {
        this.allUserReviews.set(listReview as any);
        this.cdr.detectChanges();
      });
  }

  // Bộ lọc đánh giá dựa trên search query
  filteredReviews = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.allUserReviews().filter(
      (review) =>
        review.product_id.product_name.toLowerCase().includes(q) ||
        review.comments.toLowerCase().includes(q),
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
      this.selectedReviewIds.set(this.filteredReviews().map((r) => r._id!));
    } else {
      this.selectedReviewIds.set([]);
    }
  }

  toggleReview(id: string) {
    const current = this.selectedReviewIds();
    this.selectedReviewIds.set(
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );
  }

  deleteSelectedReviews() {
    const selected = this.selectedReviewIds();
    this.allUserReviews.update((reviews) => reviews.filter((r) => !selected.includes(r._id!)));
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
  countDiscountPrice(price: number, discount_percent: number, quantity: number) {
    return Math.round((discount_percent / 100) * price * quantity);
  }
  formatDateTime(date: string | Date) {
    return formatDate(date);
  }
}
