import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PaymentMethodItem {
  id: string;
  type: string;
  bankName: string;
  name: string;
  isDefault: boolean;
  description: string;
  icon: string;
  cardNumber?: string; // Dấu ? nghĩa là có cũng được, không có cũng không sao
  owner?: string; // Dấu ? để tránh lỗi với kiểu 'cash'
}

@Component({
  selector: 'app-my-payment-method',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-payment-method.html',
  styleUrl: './my-payment-method.css',
})
export class MyPaymentMethod {
  searchQuery = signal('');
  isAddingNew = signal(false);
  showConfirmDelete = signal(false);
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

  isDropdownOpen = signal(false);

  filteredSubNames = computed(() => {
    const list = this.newMethodType() === 'bank' ? this.banks : this.wallets;
    const search = this.newMethodSubName().toLowerCase();
    return list.filter((item) => item.toLowerCase().includes(search));
  });
  
  selectSubName(name: string) {
    this.newMethodSubName.set(name); // Dùng .set cho Signal
    this.isDropdownOpen.set(false);
  }

  // Khai báo lại dưới dạng Signal
  newMethodType = signal('bank');
  newMethodSubName = signal('');
  newMethodCardNumber = signal('');
  newMethodOwner = signal('NGUYEN BAO HUY');

  // Hàm Reset Form
  resetForm() {
    this.newMethodSubName.set('');
    this.newMethodCardNumber.set('');
  }

  // Hàm mở Popup (Đảm bảo popup luôn trống khi mở mới)
  openAddPopup() {
    this.newMethodType.set('bank');
    this.resetForm();
    this.isAddingNew.set(true);
  }

  // Thêm <PaymentMethodItem[]> vào sau signal
  paymentMethods = signal<PaymentMethodItem[]>([
    {
      id: 'pm-1',
      type: 'cash',
      bankName: 'Tiền mặt',
      name: 'Thanh toán tiền mặt',
      isDefault: true,
      description: 'Đang sử dụng đối với: Thông tin đặt hàng của Nguyễn Bảo Huy',
      icon: 'bi bi-cash-stack',
      // Không có cardNumber và owner ở đây là hợp lệ nhờ dấu ? trong interface
    },
    {
      id: 'pm-2',
      type: 'bank',
      bankName: 'Vietcombank',
      name: 'Ngân hàng', // THÊM DÒNG NÀY VÀO LÀ HẾT ĐỎ NGAY
      cardNumber: '1029 327 289',
      owner: 'NGUYEN BAO HUY',
      isDefault: false,
      description: 'Đang sử dụng đối với: Thông tin đặt hàng của Nguyễn Bảo Huy',
      icon: 'bi bi-credit-card-2-front',
    },
  ]);

  // Tìm và thay thế đoạn sortedMethods bằng đoạn này
  sortedMethods = computed(() => {
    const q = this.searchQuery().toLowerCase();

    // 1. Lọc theo tên ngân hàng hoặc tên chủ sở hữu khi Huy gõ vào ô search
    const filtered = this.paymentMethods().filter(
      (m) =>
        m.bankName.toLowerCase().includes(q) ||
        m.owner?.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q),
    );

    // 2. Sau đó mới sắp xếp đưa thằng mặc định lên đầu
    return filtered.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return 0;
    });
  });

  selectedIds = signal<string[]>([]);

  // ĐẶT MẶC ĐỊNH
  setDefault(id: string) {
    this.paymentMethods.update((methods) => methods.map((m) => ({ ...m, isDefault: m.id === id })));
    this.showToast('Đã thay đổi phương thức mặc định thành công!', 'success');
  }

  // LƯU THÊM MỚI
  saveNewMethod() {
    // SỬA DÒNG NÀY:
    if (!this.newMethodSubName() || !this.newMethodCardNumber()) {
      this.showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    // SỬA CÁC DÒNG TRONG newItem:
    const newItem: PaymentMethodItem = {
      id: 'pm-' + Date.now(),
      type: this.newMethodType(),
      bankName: this.newMethodSubName(),
      name: this.newMethodType() === 'bank' ? 'Ngân hàng' : 'Ví điện tử',
      cardNumber: this.newMethodCardNumber(),
      owner: this.newMethodOwner(),
      isDefault: false,
      description: 'Đang sử dụng đối với: Thông tin đặt hàng của Nguyễn Bảo Huy',
      icon: this.newMethodType() === 'bank' ? 'bi bi-credit-card-2-front' : 'bi bi-wallet2',
    };

    this.paymentMethods.update((m) => [...m, newItem]);
    this.isAddingNew.set(false);
    this.showToast('Thêm phương thức thanh toán thành công!', 'success');
  }

  // XÓA THỰC TẾ
  confirmDelete() {
    const selected = this.selectedIds();
    this.paymentMethods.update((methods) => methods.filter((m) => !selected.includes(m.id)));
    this.selectedIds.set([]);
    this.showConfirmDelete.set(false);
    this.showToast('Đã xóa các phương thức thanh toán được chọn!', 'success');
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.notification.set({ msg, type });
    setTimeout(() => this.notification.set(null), 3000);
  }

  toggleSelect(id: string) {
    const current = this.selectedIds();
    this.selectedIds.set(current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  }

  toggleSelectAll(event: any) {
    this.selectedIds.set(event.target.checked ? this.paymentMethods().map((p) => p.id) : []);
  }

  openDeleteModal() {
    if (this.selectedIds().length > 0) this.showConfirmDelete.set(true);
    else this.showToast('Vui lòng chọn phương thức cần xóa!', 'error');
  }

  get methodsToDelete() {
    return this.paymentMethods().filter((m) => this.selectedIds().includes(m.id));
  }
}
