import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderEvents } from '../../events/header-events/header-events';
import { FooterEvents } from '../../events/footer-events/footer-events';

@Component({
  selector: 'app-events-layout',
  imports: [RouterModule, HeaderEvents, FooterEvents],
  templateUrl: './events-layout.html',
  styleUrl: './events-layout.css',
})
export class EventsLayout {}
