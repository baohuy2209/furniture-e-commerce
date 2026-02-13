import { Component } from '@angular/core';

@Component({
  selector: 'app-events-hero',
  standalone: true,
  imports: [],
  templateUrl: './events-hero.html',
  styleUrl: './events-hero.css',
})
export class EventsHero {
  scrollToEvent() {
    const el = document.getElementById('featured-event');
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

}
