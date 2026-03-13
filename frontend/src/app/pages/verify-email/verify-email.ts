import { AuthService } from './../../services/auth';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {
  otp = '';
  error = '';
  success = '';
  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}
  checkOtp() {
    this.authService.verifyEmail(this.otp).subscribe({
      next: (res) => {
        this.error = '';
        this.success = res.message;
        this.router.navigate(['/']);
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
}
