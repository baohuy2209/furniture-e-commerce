import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IEvent } from '../../../../interface';
import { EventService } from '../../../services/event-service';
@Component({
  selector: 'app-upcoming-events',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './upcoming-events.html',
  styleUrl: './upcoming-events.css',
})
export class UpcomingEvents implements OnInit {
  upCommingEvents: IEvent[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.eventService.getAllUpcommingEvents().subscribe({
      next: (res) => {
        this.upCommingEvents = res.data;
        this.success = res.message;
        console.log(this.upCommingEvents);
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  convertDate(date: Date) {
    return new Date(date);
  }
  formatDateTime(dateStr: string | Date) {
    const date = new Date(dateStr);

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
