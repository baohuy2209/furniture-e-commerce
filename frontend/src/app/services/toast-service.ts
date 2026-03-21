import { Injectable, signal, NgZone } from '@angular/core';
import { IToast, ToastType } from '../../interface/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<IToast[]>([]);

  constructor(private zone: NgZone) {}

  private add(type: ToastType, message: string, title?: string, duration = 4000) {
    this.zone.run(() => {
      const id = crypto.randomUUID();
      this.toasts.update((list) => [...list, { id, type, message, title, duration }]);

      // ✅ Wrap callback của setTimeout vào zone.run()
      setTimeout(() => this.zone.run(() => this.startHide(id)), duration - 300);
      setTimeout(() => this.zone.run(() => this.remove(id)), duration);
    });
  }

  private startHide(id: string) {
    this.zone.run(() => {
      this.toasts.update((list) => list.map((t) => (t.id === id ? { ...t, hiding: true } : t)));
    });
  }

  private remove(id: string) {
    this.zone.run(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
    });
  }

  dismiss(id: string) {
    this.zone.run(() => {
      this.startHide(id);
      setTimeout(() => this.zone.run(() => this.remove(id)), 300);
    });
  }

  success(message: string, title = 'Thành công') {
    this.add('success', message, title);
  }

  error(message: string, title = 'Lỗi') {
    this.add('error', message, title);
  }

  warning(message: string, title = 'Cảnh báo') {
    this.add('warning', message, title);
  }

  info(message: string, title = 'Thông báo') {
    this.add('info', message, title);
  }
}
