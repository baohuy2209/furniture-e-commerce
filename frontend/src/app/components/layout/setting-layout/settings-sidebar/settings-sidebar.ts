import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Cần cho routerLink, routerLinkActive

@Component({
  selector: 'app-settings-sidebar', // Selector này sẽ được dùng trong setting-layout.html
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // Import các module routing cần thiết
  templateUrl: './settings-sidebar.html',
  styleUrls: ['./settings-sidebar.css']
})
export class SettingsSidebar {
  @Input() listMenu: any[] = []; // Nhận danh sách menu từ SettingLayout

  // Bạn có thể thêm @Input() user: any; nếu muốn hiển thị avatar/tên nhỏ trong sidebar
  @Input() user: any;
  @Input() showUserInfo: boolean = true; 
}