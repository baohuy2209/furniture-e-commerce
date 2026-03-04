import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Dùng Reactive Forms
import { CommonModule } from '@angular/common'; // Cần cho *ngIf, *ngFor nếu dùng (nhưng @if/@for thì không)
import { Router } from '@angular/router'; // Để điều hướng sau khi đổi mật khẩu

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  changePasswordForm!: FormGroup; // Khai báo form group
  errorMessage: string | null = null; // Thông báo lỗi chung từ backend hoặc logic
  successMessage: string | null = null; // Thông báo thành công

  oldPasswordVisible: boolean = false;
  newPasswordVisible: boolean = false;
  confirmNewPasswordVisible: boolean = false;
  passwordRequirements = {
    length: false,
    upper: false,
    lower: false,
    special: false,
  };
  showRequirements: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8), // Kiểm tra độ dài tối thiểu
            // Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'), // Ví dụ Regex cho mật khẩu mạnh
          ],
        ],
        confirmNewPassword: ['', Validators.required],
      },
      {
        validator: this.passwordMatchValidator, // <== Custom validator để kiểm tra mật khẩu khớp
      },
    );
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe((value) => {
      this.validatePassword(value || '');
    });
  }

  // Custom validator để kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp nhau không
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword && confirmNewPassword && newPassword !== confirmNewPassword
      ? { passwordMismatch: true }
      : null;
  }

  toggleOldPasswordVisibility(): void {
    this.oldPasswordVisible = !this.oldPasswordVisible;
  }

  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible = !this.newPasswordVisible;
  }

  toggleConfirmNewPasswordVisibility(): void {
    this.confirmNewPasswordVisible = !this.confirmNewPasswordVisible;
  }

  validatePassword(password: string) {
    this.passwordRequirements.length = password.length >= 8;
    this.passwordRequirements.upper = /[A-Z]/.test(password);
    this.passwordRequirements.lower = /[a-z]/.test(password);
    this.passwordRequirements.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  // Hàm xử lý khi submit form
  onSubmit(): void {
    this.errorMessage = null; // Xóa lỗi cũ
    this.successMessage = null; // Xóa thông báo thành công cũ

    if (this.changePasswordForm.valid) {
      const { oldPassword, newPassword } = this.changePasswordForm.value;
      console.log('Đang đổi mật khẩu...', { oldPassword, newPassword });

      setTimeout(() => {
        // Giả lập lỗi mật khẩu cũ không đúng
        if (oldPassword === 'wrongpass') {
          this.errorMessage = 'Mật khẩu cũ không đúng.';
        }
        // Giả lập lỗi mật khẩu mới không hợp lệ
        else if (newPassword.length < 8) {
          this.errorMessage = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
        }
        // Giả lập lỗi không khớp mật khẩu (nếu validator chưa bắt được hoặc bỏ qua)
        else if (this.changePasswordForm.errors?.['passwordMismatch']) {
          this.errorMessage = 'Mật khẩu mới và xác nhận mật khẩu không khớp.';
        }
        // Giả lập thành công
        else {
          this.successMessage = 'Thay đổi mật khẩu thành công!';
          this.changePasswordForm.reset();
          // Reset validators state sau reset
          Object.keys(this.changePasswordForm.controls).forEach((key) => {
            this.changePasswordForm.get(key)?.setErrors(null);
          });
        }
      }, 2000);
    } else {
      // Nếu form không hợp lệ (do Validators client-side)
      // Hiển thị lỗi mật khẩu không khớp
      if (this.changePasswordForm.errors?.['passwordMismatch']) {
        this.errorMessage = 'Mật khẩu mới và xác nhận mật khẩu không khớp.'; // Lỗi BPMN: không khớp mật khẩu
      } else {
        this.errorMessage = 'Vui lòng kiểm tra lại các trường đã nhập.';
      }
      this.changePasswordForm.markAllAsTouched(); // Đánh dấu tất cả các trường là touched để hiển thị lỗi
    }
  }

  // Getters tiện lợi để truy cập các form controls trong template
  get oldPassword() {
    return this.changePasswordForm.get('oldPassword');
  }
  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }
  get confirmNewPassword() {
    return this.changePasswordForm.get('confirmNewPassword');
  }
}