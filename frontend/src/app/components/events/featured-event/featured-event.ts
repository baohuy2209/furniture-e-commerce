import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventRegistrationModal } from '../event-registration-modal/event-registration-modal';
import { IEvent } from '../../../../interface';
import { EventService } from '../../../services/event-service';
@Component({
  selector: 'app-featured-event',
  imports: [CommonModule, RouterModule, EventRegistrationModal],
  templateUrl: './featured-event.html',
  styleUrl: './featured-event.css',
})
export class FeaturedEvent implements OnInit {
  isModalOpen = false;
  listCurrentEvents: IEvent[] = [];
  numBrands: number = 0;
  success: string = '';
  error: string = '';
  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.numBrands = this.getRandomNumber();
    this.eventService.getAllCurrentEvents().subscribe({
      next: (res) => {
        this.listCurrentEvents = res.data;
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
  openRegisterModal() {
    this.isModalOpen = true;
  }

  closeRegisterModal() {
    this.isModalOpen = false;
  }
  getRandomNumber() {
    return Math.floor(Math.random() * 10) + 1;
  }
}
