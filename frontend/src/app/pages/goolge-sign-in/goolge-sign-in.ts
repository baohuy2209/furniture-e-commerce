import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
declare const google: any;
@Component({
  selector: 'app-goolge-sign-in',
  imports: [],
  templateUrl: './goolge-sign-in.html',
  styleUrl: './goolge-sign-in.css',
})
export class GoolgeSignIn implements OnInit {
  error: string = '';
  constructor(
    private ngZone: NgZone,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: `${environment.GOOGLE_CLIENT_ID}`,
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    // google.accounts.id.renderButton(document.getElementById('google-signin-button'));

    google.accounts.id.prompt(); // also display the One Tap dialog
  }

  handleCredentialResponse(response: any) {
    const token = response.credential;
    this.ngZone.run(() => {
      this.authService.googleAuthentication(token).subscribe({
        next: (res) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          if (err.status === 404 || err.status === 400 || err.status === 401) {
            this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
          } else {
            this.error = 'Có lỗi ở phía server';
          }
          this.cdr.detectChanges();
        },
      });
    });
  }
}
