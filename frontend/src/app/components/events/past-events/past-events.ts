import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event-service';
import { IEvent } from '../../../../interface';
@Component({
  selector: 'app-past-events',
  imports: [CommonModule, RouterModule],
  templateUrl: './past-events.html',
  styleUrl: './past-events.css',
})
export class PastEvents implements OnInit {
  pastEvents: IEvent[] = [];
  success: string = '';
  error: string = '';
  videoVisible = false;
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.eventService.getAllPastEvents().subscribe({
      next: (res) => {
        this.pastEvents = res.data;
        this.success = res.message;
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

  playVideo() {
    this.videoVisible = true;
  }
}
