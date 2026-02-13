import { Component } from '@angular/core';
import { EventsHero } from '../../components/events/events-hero/events-hero';
import { Newsletter } from '../../components/events/newsletter/newsletter';
import { PastEvents } from '../../components/events/past-events/past-events';
import { UpcomingEvents } from '../../components/events/upcoming-events/upcoming-events';
import { FeaturedEvent } from '../../components/events/featured-event/featured-event';

@Component({
  selector: 'app-events',
  imports: [EventsHero, FeaturedEvent, UpcomingEvents, PastEvents, Newsletter ],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {

}
