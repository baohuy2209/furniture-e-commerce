import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // <== RẤT QUAN TRỌNG: Đảm bảo service này được cung cấp ở cấp root
})
export class AuthService {
  // <== ĐÂY LÀ NƠI CHỨA TRẠNG THÁI ĐĂNG NHẬP, SẼ CUNG CẤP CHO HEADER COMPONENT
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this._isLoggedIn.asObservable();

  constructor() {
    // Tùy chọn: kiểm tra trạng thái đăng nhập từ localStorage khi khởi tạo service
    // const storedStatus = localStorage.getItem('isLoggedIn');
    // if (storedStatus === 'true') {
    //   this._isLoggedIn.next(true);
    // }
   }

  login(): void {
    // Logic đăng nhập thực tế ở đây (ví dụ: gọi API, lưu token vào localStorage)
    this._isLoggedIn.next(true); // Cập nhật trạng thái thành đã đăng nhập
    // localStorage.setItem('isLoggedIn', 'true'); // Tùy chọn: lưu vào localStorage
    console.log('AuthService: User logged in');
  }

  logout(): void {
    // Logic đăng xuất thực tế ở đây (ví dụ: xóa token, clear session)
    this._isLoggedIn.next(false); // Cập nhật trạng thái thành chưa đăng nhập
    // localStorage.removeItem('isLoggedIn'); // Tùy chọn: xóa từ localStorage
    console.log('AuthService: User logged out');
  }
}