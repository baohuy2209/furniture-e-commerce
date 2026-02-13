import { Component } from '@angular/core';

interface UpcomingEvent {
  id: number;
  title: string;
  desc: string;
  image: string;
}

@Component({
  selector: 'app-upcoming-events',
  standalone: true,
  templateUrl: './upcoming-events.html',
  styleUrl: './upcoming-events.css'
})
export class UpcomingEvents {

  events: UpcomingEvent[] = [
    {
      id: 1,
      title: 'Minimal Living Workshop',
      desc: 'Workshop thiết kế không gian sống tối giản.',
      image: '/assets/events/upcoming1.jpg'
    },
    {
      id: 2,
      title: 'Luxury Furniture Expo',
      desc: 'Triển lãm nội thất cao cấp.',
      image: '/assets/events/upcoming2.jpg'
    },
    {
      id: 3,
      title: 'Green Home Seminar',
      desc: 'Giải pháp sống xanh bền vững.',
      image: '/assets/events/upcoming3.jpg'
    }
  ];

}
