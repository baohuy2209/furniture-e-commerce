import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-event-registration-modal',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './event-registration-modal.html',
  styleUrl: './event-registration-modal.css',
})
export class EventRegistrationModal {
  @Input() event!: Event;
  @Output() close = new EventEmitter<void>();

  step: 'form' | 'success' = 'form';

  // Form Data
  formData = {
    fullname: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1,
    note: '',
    agreed: false,
  };

  closeModal() {
    this.close.emit();
  }

  submitForm() {
    if (!this.formData.agreed) {
      alert('Vui lòng đồng ý với điều khoản tham dự.');
      return;
    }
    this.step = 'success';
  }

  finish() {
    this.closeModal();
    // Reset form for next time if needed, though component is usually destroyed
    this.step = 'form';
    this.formData = {
      fullname: '',
      email: '',
      phone: '',
      address: '',
      quantity: 1,
      note: '',
      agreed: false,
    };
  }
}
