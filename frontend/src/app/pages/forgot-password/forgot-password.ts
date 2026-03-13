import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  step = 1;
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  userId = '';

  showNewPassword = false;
  showConfirmPassword = false;

  error = '';
  success = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Step 1: Send Email -> Check Otp
  sendOtp() {
    if (!this.email) {
      this.error = 'Vui lòng nhập email';
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.email)) {
      this.error = 'Email không hợp lệ';
      return;
    }

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.error = '';
        this.success = `Đã gửi mã OTP cho ${res.data.email}`;
        this.step = 2;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Email người không tồn tại';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }

  get confirmPasswordError(): string {
    if (!this.confirmPassword) return '';
    return this.newPassword === this.confirmPassword ? '' : 'Mật khẩu xác nhận không khớp';
  }

  get isResetFormValid(): boolean {
    return (
      !!this.newPassword &&
      this.isPasswordValid &&
      !!this.confirmPassword &&
      !this.confirmPasswordError
    );
  }
  // Step 2: Check OTP
  checkOtp() {
    this.authService.checkOtp(this.otp).subscribe({
      next: (res) => {
        this.error = '';
        this.success = 'Mã OTP xác thực đúng';
        this.userId = res.data._id;
        this.step = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Sai mã OTP';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  // Step 3: Reset Password
  resetPassword() {
    if (!this.isResetFormValid) {
      this.error = 'Vui lòng kiểm tra lại thông tin';
      return;
    }
    this.authService.resetPassword(this.userId, this.newPassword).subscribe({
      next: (res) => {
        this.error = '';
        this.success = 'Đổi mật khẩu thành công ';
        this.cdr.detectChanges();
        this.router.navigate(['/auth/sign-in']);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Sai mã OTP';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
    // Simulate reset
    alert('Đổi mật khẩu thành công! 🎉');
    this.router.navigate(['/auth/sign-in']);
  }

  get passwordErrors() {
    return {
      minLength: this.newPassword.length < 8,
      hasUpper: !/[A-Z]/.test(this.newPassword),
      hasLower: !/[a-z]/.test(this.newPassword),
      hasSpecial: !/[!@#$%^&*(),.?":{}|_<>-]/.test(this.newPassword),
    };
  }

  get isPasswordValid() {
    const errors = this.passwordErrors;
    return !errors.minLength && !errors.hasUpper && !errors.hasLower && !errors.hasSpecial;
  }
}
