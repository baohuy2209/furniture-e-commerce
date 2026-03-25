import { Component, inject, Input } from '@angular/core';
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
  @Input() user!: IUser | null; // Nhận dữ liệu user từ component cha (SettingLayout)
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.user) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.userService.updateUserAvatar(file).subscribe({
          next: (res) => {
            this.toastService.success(`${res.message}`);
          },
          error: (err: any) => {
            this.toastService.error(err.error?.message || 'Không thể cập nhật ảnh đại diện');
          },
        });
      };
      reader.readAsDataURL(file);
    }
  }
}
