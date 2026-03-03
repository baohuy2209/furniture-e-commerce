import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  error = '';
  success = '';

  constructor(private router: Router) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get passwordErrors() {
    return {
      minLength: this.password.length < 8,
      hasUpper: !/[A-Z]/.test(this.password),
      hasLower: !/[a-z]/.test(this.password),
      hasSpecial: !/[!@#$%^&*(),.?":{}|<>]/.test(this.password)
    };
  }

  get isPasswordValid() {
    const errors = this.passwordErrors;
    return !errors.minLength && !errors.hasUpper && !errors.hasLower && !errors.hasSpecial;
  }

  // Getters for specific field errors
  get emailError(): string {
    if (!this.email) return '';
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(this.email) ? '' : 'Email không hợp lệ';
  }

  get phoneError(): string {
    if (!this.phone) return '';
    const re = /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
    // Basic 10-digit check if regex is too strict for testing
    const simpleRe = /^[0-9]{10}$/;
    return simpleRe.test(this.phone) ? '' : 'Số điện thoại phải là 10 chữ số';
  }

  get confirmPasswordError(): string {
    if (!this.confirmPassword) return '';
    return this.password === this.confirmPassword ? '' : 'Mật khẩu xác nhận không khớp';
  }

  // Master getter for form validity
  get isFormValid(): boolean {
    return !!this.fullName &&
      !!this.email && !this.emailError &&
      !!this.phone && !this.phoneError &&
      !!this.password && this.isPasswordValid &&
      !!this.confirmPassword && !this.confirmPasswordError;
  }

  signUp() {
    this.error = '';
    this.success = '';

    if (!this.isFormValid) {
      // Should be disabled, but just in case
      this.error = 'Vui lòng kiểm tra lại thông tin';
      return;
    }

    // Mock Success
    const newUser = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password, // In real app, never store plain text!
      role: 'customer',
      createdAt: new Date()
    };

    // Simulate saving (optional)
    // const users = JSON.parse(localStorage.getItem('users') || '[]');
    // users.push(newUser);
    // localStorage.setItem('users', JSON.stringify(users));

    this.success = 'Đăng ký thành công! Đang chuyển hướng...';

    setTimeout(() => {
      this.router.navigate(['/auth/sign-in']);
    }, 1500);
  }
}
