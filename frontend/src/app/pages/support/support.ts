import { CustomerInquiryService } from './../../services/customer-inquiry-service';
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICustomerInquiry } from '../../../interface';

@Component({
  selector: 'app-support',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support {
  supportForm = signal<
    Omit<
      ICustomerInquiry,
      '_id' | 'user_id' | 'status' | 'resolving_staff_id' | 'staff_response'
    > & { category: string }
  >({
    subject: '',
    message: '',
    category: '',
  });

  isSubmitting = signal(false);
  showSuccessModal = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private customerInquiryService: CustomerInquiryService) {}

  onSubmit() {
    // Validate
    const form = this.supportForm();
    if (!form.subject || !form.message || !form.category) {
      this.errorMessage.set('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      subject: form.subject,
      message: form.message,
      category: form.category,
    } as unknown as ICustomerInquiry;

    this.customerInquiryService.createInquiry(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Gửi yêu cầu thất bại, vui lòng thử lại!');
      },
    });
  }

  closeAndReset() {
    this.showSuccessModal.set(false);
    this.supportForm.update((f) => ({
      ...f,
      category: '',
      subject: '',
      message: '',
    }));
  }
}
