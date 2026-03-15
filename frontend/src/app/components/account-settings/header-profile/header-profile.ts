import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-profile',
  imports: [],
  templateUrl: './header-profile.html',
  styleUrl: './header-profile.css',
})
export class HeaderProfile {
  @Input() user: any; // Nhận dữ liệu user từ component cha (SettingLayout)
}
