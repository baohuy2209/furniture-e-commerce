import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventRegistrationModal } from '../event-registration-modal/event-registration-modal';
import { IEvent } from '../../../../interface';
import { EventService } from '../../../services/event-service';
@Component({
  selector: 'app-featured-event',
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-event.html',
  styleUrl: './featured-event.css',
})
export class FeaturedEvent implements OnInit {
  isModalOpen = false;
  listCurrentEvents: IEvent[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.eventService.getAllCurrentEvents().subscribe({
      next: (res) => {
        this.listCurrentEvents = res.data;
        this.success = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  openRegisterModal() {
    this.isModalOpen = true;
  }

  closeRegisterModal() {
    this.isModalOpen = false;
  }

  event = {
    event_id: 1,
    event_name: 'Interior Harmony Expo 2025',
    description:
      'Triển lãm nội thất nghệ thuật – Cân bằng lý trí & cảm xúc. Khám phá cách phối cảnh, ánh sáng, màu sắc và vật liệu tạo không gian sống mang dấu ấn cá nhân.',
    date: { day: 15, month: 1, year: 2025 },
    time: '08:00 - 17:00',
    location: 'HomeBase Quận 2, TP.HCM',
    thumbnail_image: '/images/event/event_images1.jpg',
    event_status: 'ONGOING',
    event_type: 'EXHIBITION',
    price: 0,
    max_participants: 500,
    stats: {
      attendees: 500,
      brands: 15,
      workshops: 6,
    },
    is_featured: true,
  };
}
