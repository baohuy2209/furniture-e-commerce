import { Component, Input, inject } from '@angular/core';
import { IUser } from '../../../../interface';
import { UserService } from '../../../services/user-service';
import { ToastService } from '../../../services/toast-service';

@Component({
  selector: 'app-header-profile',
  imports: [],
  templateUrl: './header-profile.html',
  styleUrl: './header-profile.css',
})
export class HeaderProfile {
  @Input() user!: IUser | null;
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.user) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const updatedUser = { ...this.user!, avatar: e.target.result };
        this.userService.updateUserProfile(updatedUser).subscribe({
          next: () => {
            this.toastService.success('Đã cập nhật ảnh đại diện');
          },
          error: (err: any) => {
            this.toastService.error(err.error?.message || 'Không thể cập nhật ảnh đại diện');
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }
}
