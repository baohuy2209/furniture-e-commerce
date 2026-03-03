import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-upcoming-events',
  imports: [CommonModule, RouterModule, DecimalPipe],
  standalone: true,
  templateUrl: './upcoming-events.html',
  styleUrl: './upcoming-events.css',
})
export class UpcomingEvents {
  events = [
    {
      event_id: 2,
      event_name: 'Art Deco Revival Workshop',
      description: 'Học cách phối đồ nội thất theo phong cách Art Deco cổ điển kết hợp hiện đại.',
      date: { day: 15, month: 1, year: 2025 },
      time: '14:00 - 17:00',
      location: 'HomeBase Workshop Room',
      thumbnail_image: '/images/event/event_images1.jpg',
      event_status: 'UPCOMING',
      event_type: 'WORKSHOP',
      price: 300000,
      max_participants: 20,
      is_featured: false,
    },
    {
      event_id: 3,
      event_name: 'New Collection Launch 2026',
      description: 'Ra mắt bộ sưu tập nội thất 2026 với thiết kế độc quyền.',
      date: { day: 5, month: 2, year: 2025 },
      time: '09:00 - 18:00',
      location: 'HomeBase Showroom',
      thumbnail_image: '/images/event/event_images2.jpg',
      event_status: 'UPCOMING',
      event_type: 'LAUNCH',
      price: 0,
      max_participants: 100,
      is_featured: true,
    },
    {
      event_id: 4,
      event_name: 'Eco-Living Showcase',
      description: 'Khám phá xu hướng nội thất bền vững và thân thiện môi trường.',
      date: { day: 22, month: 1, year: 2025 },
      time: '19:00 - 22:00',
      location: 'HomeBase Green Zone',
      thumbnail_image: '/images/event/event_images3.jpg',
      event_status: 'UPCOMING',
      event_type: 'EXHIBITION',
      price: 0,
      max_participants: 50,
      is_featured: false,
    },
  ];
}
