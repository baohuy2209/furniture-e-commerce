import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ConfirmModalType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'hb-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
})
export class ConfirmModal {
  @Input() isOpen = false;
  @Input() title = 'Xác nhận hành động';
  @Input() message = 'Bạn có chắc chắn muốn thực hiện hành động này không?';
  @Input() type: ConfirmModalType = 'info';
  @Input() confirmLabel = 'Xác nhận';
  @Input() cancelLabel = 'Hủy bỏ';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isOpen = false;
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('hb-modal-overlay')) {
      this.onCancel();
    }
  }
}
