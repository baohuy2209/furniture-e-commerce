import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-past-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './past-events.html',
  styleUrl: './past-events.css'
})
export class PastEvents {

  pastEvents: Event[] = [
    {
      event_id: 11,
      event_name: 'Minimalist Living Workshop',
      description: '',
      date: { day: 10, month: 12, year: 2024 },
      time: '14:00',
      location: 'HCM',
      thumbnail_image: '/images/event/event_images1.jpg',
      event_status: 'PAST',
      event_type: 'WORKSHOP',
      price: 0,
      max_participants: 50
    },
    {
      event_id: 12,
      event_name: 'Summer Vibes Collection',
      description: '',
      date: { day: 15, month: 6, year: 2024 },
      time: '09:00',
      location: 'HN',
      thumbnail_image: '/images/event/event_images2.jpg',
      event_status: 'PAST',
      event_type: 'LAUNCH',
      price: 0,
      max_participants: 100
    },
    {
      event_id: 13,
      event_name: 'Sustainable Furniture Expo',
      description: '',
      date: { day: 20, month: 11, year: 2024 },
      time: '08:00',
      location: 'DN',
      thumbnail_image: '/images/event/event_images3.jpg',
      event_status: 'PAST',
      event_type: 'EXHIBITION',
      price: 0,
      max_participants: 200
    },
     {
      event_id: 14,
      event_name: 'Outdoor Living',
      description: '',
      date: { day: 5, month: 5, year: 2024 },
      time: '08:00',
      location: 'HCM',
      thumbnail_image: '/images/event/event_images4.jpg',
      event_status: 'PAST',
      event_type: 'POP-UP',
      price: 0,
      max_participants: 80
    }
  ];

}
