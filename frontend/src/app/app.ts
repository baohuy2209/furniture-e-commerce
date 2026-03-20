import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { UserProfile } from './pages/user-profile/user-profile';
import { Toasts } from './components/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterOutlet, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
