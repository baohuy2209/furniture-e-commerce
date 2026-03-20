import { MyPaymentService } from '../../services/my-payment-service';
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast-service';
import { IPaymentMethod } from '../../../interface';

@Component({
  selector: 'app-my-payment-method',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './my-payment-method.html',
  styleUrl: './my-payment-method.css',
})
export class MyPaymentMethod implements OnInit {
  searchQuery = signal('');
  isAddingNew = signal(false);
  showConfirmDelete = signal(false);
  isLoading = signal(false);
  notification = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  banks = [
    'ABBANK',
    'ACB',
    'Agribank',
    'ANZVL',
    'Bac A Bank',
    'BAOVIET Bank',
    'BIDV',
    'BVBank',
    'CIMB',
    'Co-opBank',
    'Eximbank',
    'GPBank',
    'HDBank',
    'HLBVN',
    'HSBC',
    'IVB',
    'Kienlongbank',
    'LVBank',
    'MBBANK',
    'MBV',
    'MSB',
    'Nam A Bank',
    'NCB',
    'OCB',
    'PBVN',
    'PGBank',
    'PVcomBank',
    'Sacombank',
    'SAIGONBANK',
    'SCB',
    'SCBVL',
    'SeABank',
    'SHB',
    'SHBVN',
    'Techcombank',
    'TPBank',
    'UOB',
    'VBSP',
    'VCBNeo',
    'VDB',
    'VietABank',
    'Vietbank',
    'Vietcombank',
    'VietinBank',
    'VIB',
    'Vikki Bank',
    'VPBank',
    'VRB',
    'Woori',
  ].sort();

  wallets = [
    'Moca',
    'MobiFone Pay',
    'Shopee Pay',
    'ViettelPay',
    'Ví điện tử 9Pay',
    'Ví điện tử Foxpay',
    'Ví điện tử TrueMoney',
    'Ví Ngân Lượng',
    'Ví VNPAY',
    'VNPT Pay',
  ].sort();

  constructor(
    private myPaymentService: MyPaymentService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  // ===== LOAD DATA =====
  loadPaymentMethods() {
    this.isLoading.set(true);
    this.myPaymentService.getUserPayment().subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.showToast('Không thể tải danh sách phương thức thanh toán!', 'error');
        this.isLoading.set(false);
      },
    });
  }

  // ===== DROPDOWN =====
  isDropdownOpen = signal(false);

  filteredSubNames = computed(() => {
    const list = this.newMethodType() === 'bank' ? this.banks : this.wallets;
    const search = this.newMethodSubName().toLowerCase();
    return list.filter((item) => item.toLowerCase().includes(search));
  });

  selectSubName(name: string) {
    this.newMethodSubName.set(name);
    this.isDropdownOpen.set(false);
  }

  // ===== FORM SIGNALS =====
  newMethodType = signal('bank');
  newMethodSubName = signal('');
  newMethodCardNumber = signal('');
  newMethodOwner = signal('NGUYEN BAO HUY');

  resetForm() {
    this.newMethodSubName.set('');
    this.newMethodCardNumber.set('');
  }

  openAddPopup() {
    this.newMethodType.set('bank');
    this.resetForm();
    this.isAddingNew.set(true);
  }

  // ===== PAYMENT METHODS STATE =====
  paymentMethods = signal<IPaymentMethod[]>([]);

  sortedMethods = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const filtered = this.paymentMethods().filter(
      (m) =>
        m.bankName.toLowerCase().includes(q) ||
        m.owner?.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q),
    );
    return filtered.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return 0;
    });
  });

  selectedIds = signal<string[]>([]);

  // ===== ĐẶT MẶC ĐỊNH =====
  setDefault(id: string) {
    this.myPaymentService.setDefaultPaymentMethod(id).subscribe({
      next: (res) => {
        // Cập nhật local state theo response từ server
        this.paymentMethods.update((methods) =>
          methods.map((m) => ({ ...m, isDefault: m._id === id ? res.data.isDefault : 'false' })),
        );
        this.showToast('Đã thay đổi phương thức mặc định thành công!', 'success');
      },
      error: () => {
        this.showToast('Không thể đặt mặc định, vui lòng thử lại!', 'error');
      },
    });
  }

  // ===== THÊM MỚI =====
  saveNewMethod() {
    if (!this.newMethodSubName() || !this.newMethodCardNumber()) {
      this.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    const newItem: Omit<IPaymentMethod, '_id'> = {
      user_id: '', // server sẽ tự gán từ token
      type: this.newMethodType(),
      bankName: this.newMethodSubName(),
      name: this.newMethodType() === 'bank' ? 'Ngân hàng' : 'Ví điện tử',
      cardNumber: this.newMethodCardNumber(),
      owner: this.newMethodOwner(),
      isDefault: 'false',
    };

    this.myPaymentService.createNewPaymentMethod(newItem as IPaymentMethod).subscribe({
      next: (res) => {
        this.paymentMethods.update((m) => [...m, res.data]);
        this.isAddingNew.set(false);
        this.resetForm();
        this.showToast('Thêm phương thức thanh toán thành công!', 'success');
      },
      error: () => {
        this.showToast('Không thể thêm phương thức thanh toán, vui lòng thử lại!', 'error');
      },
    });
  }

  // ===== XÓA =====
  confirmDelete() {
    const selected = this.selectedIds();

    // Gọi API xóa song song tất cả id được chọn
    const deleteRequests = selected.map((id) =>
      this.myPaymentService.deletePaymentMethod(id).subscribe({
        error: () => this.showToast(`Không thể xóa phương thức ${id}!`, 'error'),
      }),
    );

    // Cập nhật local state sau khi gọi API
    this.paymentMethods.update(
      (methods) => methods.filter((m) => !selected.includes(m._id)), // dùng _id thay vì id
    );
    this.selectedIds.set([]);
    this.showConfirmDelete.set(false);
    this.showToast('Đã xóa các phương thức thanh toán được chọn!', 'success');
  }

  // ===== UTILITIES =====
  showToast(msg: string, type: 'success' | 'error') {
    this.notification.set({ msg, type });
    setTimeout(() => this.notification.set(null), 3000);
  }

  toggleSelect(id: string) {
    const current = this.selectedIds();
    this.selectedIds.set(current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  }

  toggleSelectAll(event: any) {
    this.selectedIds.set(
      event.target.checked ? this.paymentMethods().map((p) => p._id) : [], // dùng _id
    );
  }

  openDeleteModal() {
    if (this.selectedIds().length > 0) this.showConfirmDelete.set(true);
    else this.showToast('Vui lòng chọn phương thức cần xóa!', 'error');
  }

  get methodsToDelete() {
    return this.paymentMethods().filter((m) => this.selectedIds().includes(m._id)); // dùng _id
  }
}
