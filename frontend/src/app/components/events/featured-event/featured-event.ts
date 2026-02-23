import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Event } from '../../../models/event.model';
import { RouterModule } from '@angular/router';

import { EventRegistrationModal } from '../event-registration-modal/event-registration-modal';

@Component({
  selector: 'app-featured-event',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe, EventRegistrationModal],
  templateUrl: './featured-event.html',
  styleUrl: './featured-event.css',
})
export class FeaturedEvent {
  isModalOpen = false;

  openRegisterModal() {
    this.isModalOpen = true;
  }

  closeRegisterModal() {
    this.isModalOpen = false;
  }

  event: Event = {
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
    is_featured: true
  };
}
