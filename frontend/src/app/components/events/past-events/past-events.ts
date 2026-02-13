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
      id: 11,
      title: 'Minimalist Living Workshop',
      description: '',
      date: { day: 10, month: 12, year: 2024 },
      time: '14:00',
      location: 'HCM',
      image: '/images/event/event_images1.jpg',
      status: 'PAST',
      type: 'WORKSHOP',
      price: 0
    },
    {
      id: 12,
      title: 'Summer Vibes Collection',
      description: '',
      date: { day: 15, month: 6, year: 2024 },
      time: '09:00',
      location: 'HN',
      image: '/images/event/event_images2.jpg',
      status: 'PAST',
      type: 'LAUNCH',
      price: 0
    },
    {
      id: 13,
      title: 'Sustainable Furniture Expo',
      description: '',
      date: { day: 20, month: 11, year: 2024 },
      time: '08:00',
      location: 'DN',
      image: '/images/event/event_images3.jpg',
      status: 'PAST',
      type: 'EXHIBITION',
      price: 0
    },
     {
      id: 14,
      title: 'Outdoor Living',
      description: '',
      date: { day: 5, month: 5, year: 2024 },
      time: '08:00',
      location: 'HCM',
      image: '/images/event/event_images4.jpg', // Ensure this image exists
      status: 'PAST',
      type: 'POP-UP',
      price: 0
    }
  ];

}
