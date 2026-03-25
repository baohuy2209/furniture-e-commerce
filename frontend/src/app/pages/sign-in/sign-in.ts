import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { GoolgeSignIn } from '../goolge-sign-in/goolge-sign-in';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, GoolgeSignIn],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  form = {
    email: '',
    password: '',
  };
  error = '';
  success = '';
  passwordVisible: boolean = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  login(f: any) {
    if (f.invalid) {
      this.error = 'Vui lòng kiểm tra lại thông tin đăng nhập';
      return;
    }
    this.authService.login(this.form.email, this.form.password).subscribe({
      next: (res) => {
        if (!res.data) {
          this.error = 'Sai email hoặc mật khẩu';
          this.cdr.detectChanges();
        }
        this.success = res.message;
        f.reset();
        if (res.data.roles.includes('ROLE_ADMIN') || res.data.roles.includes('ROLE_MODERATOR')) {
          this.router.navigate(['/admin']);
          return;
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Sai email hoặc mật khẩu';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
