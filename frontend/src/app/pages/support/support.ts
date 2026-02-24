import { Component, signal } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SupportRequest {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
  styleUrl: './support.css'
})
export class Support {
  

  supportForm = signal<SupportRequest>({
    fullName: 'Nguyễn Bảo Huy',
    email: 'huynguyen002311@gmail.com',
    phone: '0375686583',
    category: '',
    subject: '',
    message: ''
  });

  isSubmitting = signal(false);
  showSuccess = signal(false);
  showSuccessModal = signal(false);

  onSubmit() {
  this.isSubmitting.set(true);
  setTimeout(() => {
    this.isSubmitting.set(false);
    // Bật Pop-up lên (Thay vì showSuccess đơn thuần)
    this.showSuccessModal.set(true); 
  }, 1500);
}

closeAndReset() {
  this.showSuccessModal.set(false);
  // Reset các trường nhập liệu, giữ lại thông tin cá nhân của Huy
  this.supportForm.update((f: SupportRequest) => ({
    ...f,
    category: '',
    subject: '',
    message: ''
  }));
}
}