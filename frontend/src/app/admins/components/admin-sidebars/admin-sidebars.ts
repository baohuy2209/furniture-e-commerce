import { ToastService } from './../../../services/toast-service';
import { AuthService } from './../../../services/auth';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebars',
  imports: [RouterModule],
  templateUrl: './admin-sidebars.html',
  styleUrl: './admin-sidebars.css',
  encapsulation: ViewEncapsulation.None,
})
export class AdminSidebars implements OnInit {
  roles_users: string[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.roles_users = this.authService.getRoles();
    console.log(this.roles_users);
  }
  checkRoleModerator() {
    return this.roles_users.includes('ROLE_MODERATOR');
  }
  logout() {
    this.authService.logout().subscribe({
      next: (res) => {
        this.success = res.message;
        window.location.href = '/';
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy thông tin người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.toastService.error(`${this.error}`);
        this.cdr.detectChanges();
      },
    });
  }
}
