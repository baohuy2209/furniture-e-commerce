import { Component } from '@angular/core';

@Component({
  selector: 'app-header-profile',
  imports: [],
  templateUrl: './header-profile.html',
  styleUrl: './header-profile.css',
})
export class HeaderProfile {
  user = {
    username: 'baohuy2209',
    firstName: 'Nguyễn Bảo',
    lastName: 'Huy',
    email: 'huynguyen002311@gmail.com',
    phone: '0375686583',
    avatar: 'user/image.png',
    dob: '2005-09-22',
    address: [
      {
        specific_address: 'Phường 26, quận Bình Thạnh, Tp. Hồ Chí Minh',
        postal_code: 55000,
        is_default: true,
      },
      {
        specific_address: 'hẻm 300, đường Nguyễn Tri Phương, Bình Dương',
        postal_code: 55000,
        is_default: false,
      },
    ],
  };
}
