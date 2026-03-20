import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-toasts',
  imports: [CommonModule],
  templateUrl: './toasts.html',
  styleUrl: './toasts.css',
})
export class Toasts {
  private toastService = inject(ToastService);
  toasts = computed(() => this.toastService.toasts());

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }
}
