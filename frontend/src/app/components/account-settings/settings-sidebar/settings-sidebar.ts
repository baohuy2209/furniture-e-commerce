import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IUser } from '../../../../interface';

@Component({
  selector: 'app-settings-sidebar',
  imports: [CommonModule, RouterLink],
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css',
})
export class SettingsSidebar {
  @Input() listMenu: any[] = []; // Nhận danh sách menu từ SettingLayout

  // Bạn có thể thêm @Input() user: any; nếu muốn hiển thị avatar/tên nhỏ trong sidebar
  @Input() user!: IUser | null;
  @Input() showUserInfo: boolean = true;
}
