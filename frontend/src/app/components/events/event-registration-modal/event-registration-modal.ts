import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../../models/event.model';

@Component({
  selector: 'app-event-registration-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-registration-modal.html',
  styleUrl: './event-registration-modal.css'
})
export class EventRegistrationModal {
  @Input() event!: Event;
  @Output() close = new EventEmitter<void>();

  step: 'form' | 'success' = 'form';

  // Form Data
  formData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1,
    note: '',
    agreed: false
  };

  // Validation state (simple)
  isSubmitting = false;

  closeModal() {
    this.close.emit();
  }

  submitForm() {
    if (!this.formData.agreed) {
      alert('Vui lòng đồng ý với điều khoản tham dự.');
      return;
    }
    
    // Simulate API call
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.step = 'success';
    }, 100);
  }

  finish() {
    this.closeModal();
    // Reset form for next time if needed, though component is usually destroyed
    this.step = 'form';
    this.formData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      quantity: 1,
      note: '',
      agreed: false
    };
  }
}
