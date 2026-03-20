import { Component, Input } from '@angular/core';
import { IUser } from '../../../../interface';

@Component({
  selector: 'app-header-profile',
  imports: [],
  templateUrl: './header-profile.html',
  styleUrl: './header-profile.css',
})
export class HeaderProfile {
  @Input() user!: IUser | null; // Nhận dữ liệu user từ component cha (SettingLayout)
}
