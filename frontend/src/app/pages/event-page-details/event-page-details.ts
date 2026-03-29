import { ChangeDetectorRef, Component, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { EventRegistrationModal } from '../../components/events/event-registration-modal/event-registration-modal';
import { IEvent } from '../../../interface';
import { EventService } from '../../services/event-service';
@Component({
  selector: 'app-event-page-details',
  standalone: true,
  imports: [CommonModule, RouterModule, EventRegistrationModal],
  templateUrl: './event-page-details.html',
  styleUrl: './event-page-details.css',
})
export class EventPageDetails implements OnInit {
  event_id: string | null = '';
  event: IEvent | null = null;
  success: string = '';
  error: string = '';
  isModalOpen = false;
  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private meta: Meta,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {
    // In a real app, we would fetch event by ID from route.params
    // const id = this.route.snapshot.paramMap.get('id');
    // this.fetchEvent(id);
    this.meta.updateTag({
      name: 'description',
      content: this.event?.description || 'Sự kiện của homebase',
    });
  }
  ngOnInit(): void {
    this.event_id = this.route.snapshot.paramMap.get('id');
    this.eventService.getDetailEvent(this.event_id!).subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy sự kiện nào';
          this.cdr.detectChanges();
        }

        this.event = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây thông tin sự kiện nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
    window.scrollTo(0, 0);
  }

  goBack() {
    this.location.back();
  }

  openRegisterModal() {
    this.isModalOpen = true;
  }

  closeRegisterModal() {
    this.isModalOpen = false;
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
