import { Component } from '@angular/core';

@Component({
  selector: 'app-past-events',
  standalone: true,
  templateUrl: './past-events.html',
  styleUrl: './past-events.css'
})
export class PastEvents {

  pastImages: string[] = [
    '/assets/events/past1.jpg',
    '/assets/events/past2.jpg',
    '/assets/events/past3.jpg',
    '/assets/events/past4.jpg',
    '/assets/events/past5.jpg',
    '/assets/events/past6.jpg'
  ];

}
