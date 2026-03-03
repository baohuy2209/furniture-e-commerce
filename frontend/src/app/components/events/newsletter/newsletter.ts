import { Component } from '@angular/core';

@Component({
  selector: 'app-newsletter',
  imports: [],
  templateUrl: './newsletter.html',
  styleUrl: './newsletter.css',
})
export class Newsletter {
  onSubmit(event: Event) {
    event.preventDefault();
    // Logic to handle newsletter subscription
    alert('Cảm ơn bạn đã đăng ký nhận bản tin!');
  }
}
