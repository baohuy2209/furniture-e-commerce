import { Component } from '@angular/core';
import { EventsHero } from "../../components/events/events-hero/events-hero";
import { FeaturedEvent } from "../../components/events/featured-event/featured-event";
import { UpcomingEvents } from "../../components/events/upcoming-events/upcoming-events";
import { PastEvents } from "../../components/events/past-events/past-events";
import { Newsletter } from "../../components/events/newsletter/newsletter";

@Component({
  selector: 'app-events',
  imports: [EventsHero, FeaturedEvent, UpcomingEvents, PastEvents, Newsletter],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {

}
