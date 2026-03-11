import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  form = {
    email: '',
    password: '',
  };
  error = '';
  passwordVisible: boolean = false;
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  login(f: any) {
    if (f.invalid) {
      this.error = 'Vui lòng kiểm tra lại thông tin đăng nhập';
      return;
    }
    this.authService.login(this.form.email, this.form.password).subscribe({
      next: (res) => {
        if (!res.data) {
          this.error = res.message;
        }
        alert(`${res.message}`);
      },
      error: (err) => {
        this.error = err.message;
      },
    });
    f.reset();
  }
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  loginWithGoogle() {
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      '/mock-google-login',
      'GoogleSignIn',
      `width=${width},height=${height},top=${top},left=${left}`,
    );

    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        const googleUser = event.data.user;

        // Save to local storage
        const user = {
          ...googleUser,
          role: 'customer',
          loginAt: new Date(),
        };
        localStorage.setItem('userLogin', JSON.stringify(user));

        // Cleanup
        window.removeEventListener('message', messageHandler);

        alert(`Đăng nhập Google thành công! create chào ${user.fullName} 🎉`);
        this.router.navigate(['/']); // Redirect to home
      }
    };

    window.addEventListener('message', messageHandler);
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
