import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEvent } from '../../../../interface';
import { RegisterEventService } from '../../../services/register-event-service';
@Component({
  selector: 'app-event-registration-modal',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './event-registration-modal.html',
  styleUrl: './event-registration-modal.css',
})
export class EventRegistrationModal {
  @Input() event!: IEvent;
  @Output() close = new EventEmitter<void>();

  step: 'form' | 'success' = 'form';
  fullname: string = '';
  error: string = '';
  // Form Data
  formData = {
    fullname: '',
    email: '',
    phone: '',
    note: '',
    agreed: false,
  };
  constructor(
    private registerEventsService: RegisterEventService,
    private cdr: ChangeDetectorRef,
  ) {}

  closeModal() {
    this.close.emit();
  }

  submitForm() {
    if (!this.formData.agreed) {
      alert('Vui lòng đồng ý với điều khoản tham dự.');
      return;
    }
    this.registerEventsService
      .registerEvents(
        this.event._id,
        this.formData.fullname,
        this.formData.email,
        this.formData.phone,
        this.formData.note,
      )
      .subscribe({
        next: (res) => {
          this.fullname = res.data.fullname;
          this.step = 'success';
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

  finish() {
    this.closeModal();
    // Reset form for next time if needed, though component is usually destroyed
    this.step = 'form';
    this.formData = {
      fullname: '',
      email: '',
      phone: '',
      note: '',
      agreed: false,
    };
  }
}
