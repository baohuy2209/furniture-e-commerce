import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Event } from '../../../models/event.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-upcoming-events',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe],
  templateUrl: './upcoming-events.html',
  styleUrl: './upcoming-events.css'
})
export class UpcomingEvents {

  events: Event[] = [
    {
      id: 2,
      title: 'Art Deco Revival Workshop',
      description: 'Học cách phối đồ nội thất theo phong cách Art Deco cổ điển kết hợp hiện đại.',
      date: { day: 15, month: 1, year: 2025 },
      time: '14:00 - 17:00',
      location: 'HomeBase Workshop Room',
      image: '/images/event/event_images1.jpg',
      status: 'UPCOMING',
      type: 'WORKSHOP',
      price: 300000
    },
    {
      id: 3,
      title: 'New Collection Launch 2026',
      description: 'Ra mắt bộ sưu tập nội thất 2026 với thiết kế độc quyền.',
      date: { day: 5, month: 2, year: 2025 },
      time: '09:00 - 18:00',
      location: 'HomeBase Showroom',
      image: '/images/event/event_images2.jpg',
      status: 'UPCOMING',
      type: 'LAUNCH',
      price: 0
    },
    {
      id: 4,
      title: 'Eco-Living Showcase',
      description: 'Khám phá xu hướng nội thất bền vững và thân thiện môi trường.',
      date: { day: 22, month: 1, year: 2025 },
      time: '19:00 - 22:00',
      location: 'HomeBase Green Zone',
      image: '/images/event/event_images3.jpg',
      status: 'UPCOMING',
      type: 'EXHIBITION',
      price: 0
    }
  ];

}
