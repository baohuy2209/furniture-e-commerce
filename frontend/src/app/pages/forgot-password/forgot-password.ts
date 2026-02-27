import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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
  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  error = '';
  success = '';

  constructor(private router: Router) {}

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Step 1: Send Email -> Go to Reset Password
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

    // Simulate API call to check email
    this.error = '';
    // Directly go to reset password step as requested
    this.step = 2;
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

  // Step 2: Reset Password
  resetPassword() {
    if (!this.isResetFormValid) {
      this.error = 'Vui lòng kiểm tra lại thông tin';
      return;
    }

    // Simulate reset
    alert('Đổi mật khẩu thành công! 🎉');
    this.router.navigate(['/auth/sign-in']);
  }

  get passwordErrors() {
    return {
      minLength: this.newPassword.length < 8,
      hasUpper: !/[A-Z]/.test(this.newPassword),
      hasLower: !/[a-z]/.test(this.newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|_<>-]/.test(this.newPassword),
    };
  }

  get isPasswordValid() {
    const errors = this.passwordErrors;
    return !errors.minLength && !errors.hasUpper && !errors.hasLower && !errors.hasSpecial;
  }
}
