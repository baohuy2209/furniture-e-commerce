import { Component, Input } from '@angular/core';
// CommonModule không cần nếu chỉ dùng @if, @for
// import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-header-profile', // Selector này sẽ được dùng trong setting-layout.html
  standalone: true,
  imports: [], // Không cần imports khác nếu chỉ hiển thị dữ liệu và không có routing/forms phức tạp
  templateUrl: './header-profile.html',
  styleUrls: ['./header-profile.css']
})
export class HeaderProfile {
  @Input() user: any; // Nhận dữ liệu user từ component cha (SettingLayout)
}