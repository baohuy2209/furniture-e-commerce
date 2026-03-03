import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {

  email = '';
  password = '';
  error = '';

  constructor(private router: Router) { }

  login(form: any) {
    if (form.invalid || !this.isPasswordValid) {
      this.error = 'Vui lòng kiểm tra lại thông tin đăng nhập';
      return;
    }

    const user = {
      email: this.email,
      role: 'customer',
      loginAt: new Date()
    };

    localStorage.setItem('userLogin', JSON.stringify(user));
    alert('Đăng nhập thành công 🎉');
    form.reset();
  }

  get passwordErrorsList(): string[] {
    if (!this.password) return [];
    if (this.password.length < 8) {
      return ['Tối thiểu 8 ký tự'];
    }
    if (!/[A-Z]/.test(this.password)) {
      return ['Có chữ hoa'];
    }
    if (!/[a-z]/.test(this.password)) {
      return ['Có chữ thường'];
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(this.password)) {
      return ['Kí tự đặc biệt'];
    }
    return [];
  }

  get isPasswordValid() {
    return this.passwordErrorsList.length === 0 && this.password.length > 0;
  }

  loginWithGoogle() {
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      '/mock-google-login',
      'GoogleSignIn',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        const googleUser = event.data.user;

        // Save to local storage
        const user = {
          ...googleUser,
          role: 'customer',
          loginAt: new Date()
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
