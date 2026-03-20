import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user-service';
import { IAddress, IUser } from '../../../interface';
import { AddressService } from '../../services/address-service';
import { formatDate } from '../../utils/utils';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../services/toast-service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
interface Province {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {
  private toastService = inject(ToastService);
  user: IUser = {
    _id: '',
    username: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    avatar: '',
    status: '',
    last_login: new Date(),
    is_verified: false,
    points: 0,
    dob: '',
    roles: [],
    createdAt: new Date(),
  };
  newAddress = {
    _id: '',
    user: this.user._id,
    name: this.user.name,
    phone: this.user.phone,
    province: '',
    ward: '',
    address_detail: '',
    is_default: false,
  };
  selectedAddress: IAddress | null = null;
  listUserAddress: IAddress[] = [];
  error: string = '';
  success: string = '';
  private http = inject(HttpClient);

  provinces = signal<Province[]>([]);
  wards = signal<Ward[]>([]);

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private userAddressService: AddressService,
    private authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        this.user = res.data;
        if (this.user.dob) {
          this.user.dob = new Date(this.user.dob).toISOString().substring(0, 10);
        }
        this.cdr.detectChanges();
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
    this.userAddressService.getAllAddressUser().subscribe({
      next: (res) => {
        this.listUserAddress = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
    this.http
      .get<Province[]>('http://localhost:3000/provinces')
      .subscribe((data) => this.provinces.set(data));
  }
  formatDateTime(date: Date | string) {
    return formatDate(date);
  }
  onProvinceChange(code: string) {
    if (!code) {
      this.wards.set([]);
      this.newAddress.ward = '';
      return;
    }
    this.http
      .get<any>(`http://localhost:3000/provinces/${code}`)
      .subscribe((data) => this.wards.set(data.wards ?? []));
  }
  updateUserInfo() {
    this.userService.updateUserProfile(this.user).subscribe({
      next: (res) => {
        this.success = `Đã cập nhật thông tin của ${res.data.name}`;
        this.toastService.success(this.success);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy thông tin người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  openEditModal(item: IAddress) {
    this.selectedAddress = item;
  }
  createNewAddress(f: any) {
    if (f.invalid) {
      this.error = 'Vui lòng kiểm tra lại thông tin đăng nhập';
      return;
    }
    const selectedProvince = this.provinces().find(
      (p) => String(p.code) === this.newAddress.province,
    );
    this.newAddress.user = this.user._id;
    this.newAddress.province = selectedProvince?.name!;
    console.log(this.newAddress);
    this.userAddressService.createNewAddress(this.newAddress).subscribe({
      next: (res) => {
        this.success = `Đã tạo địa chỉ mới thành công cho người dùng ${res.data.name}`;
        this.toastService.success(`${this.success}`);
        f.reset();
        window.location.reload();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  setDefaultAddress(id: string) {
    this.userAddressService.setDefaultAddress(id).subscribe({
      next: (res) => {
        this.success = `Người dùng ${res.data.name} đã khởi tạo địa chỉ mặt định thành công`;
        this.toastService.success(`${this.success}`);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  deleteAccount() {
    this.userService.deleteAccount().subscribe({
      next: (res) => {
        this.success = res.message;
        this.toastService.success(`${this.success}`);
        setTimeout(() => {
          this.authService.logout().subscribe({
            next: (res) => {
              this.success = res.message;
              window.location.href = '/';
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
        }, 3000);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
  deleteAddress(id: string) {
    this.userAddressService.deleteAddress(id).subscribe({
      next: (res) => {
        this.success = res.message;
        this.toastService.success(`${this.success}`);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thấy địa chỉ người dùng nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
}
