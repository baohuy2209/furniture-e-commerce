import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css',
})
export class UserSettings {
  settingsGroups = signal([
    {
      id: 'notifications',
      title: 'Cấu hình thông báo (Notification Settings)',
      isExpanded: true,
      type: 'toggle-list', // Loại danh sách nút gạt
      masterToggle: true,
      items: [
        { label: 'Thông báo đơn hàng', status: true },
        { label: 'Khuyến mãi & Marketing', status: true },
        { label: 'Cập nhật sản phẩm mới', status: false },
        { label: 'Bảo mật tài khoản', status: true },
      ],
    },
    {
      id: 'language',
      title: 'Ngôn ngữ & Vùng (Language & Region)',
      isExpanded: false,
      type: 'select-box', // Loại chọn từ menu xổ xuống
      options: [
        { label: 'Ngôn ngữ hiển thị', value: 'vi', list: ['Tiếng Việt', 'English', 'French'] },
        { label: 'Đơn vị tiền tệ', value: 'VND', list: ['VND (₫)', 'USD ($)', 'EUR (€)'] },
      ],
    },
    {
      id: 'privacy',
      title: 'Quyền riêng tư & Bảo mật (Privacy & Security)',
      isExpanded: false,
      type: 'toggle-list',
      items: [
        { label: 'Hiển thị profile công khai', status: true },
        { label: 'Xác thực 2 yếu tố (2FA)', status: false },
        { label: 'Nhận diện sinh trắc học', status: true },
      ],
    },
    {
      id: 'account',
      title: 'Quản lý tài khoản (Account Actions)',
      isExpanded: false,
      type: 'danger-zone',
      actions: [
        {
          label: 'Vô hiệu hóa tài khoản tạm thời',
          btnClass: 'btn-outline-secondary',
          triggerModal: '#disableAccountModal',
        },
        {
          label: 'Xóa vĩnh viễn tài khoản',
          btnClass: 'btn-danger',
          triggerModal: '#deleteAccountModal', // THÊM DÒNG NÀY: ID của modal
        },
      ],
    },
  ]);

  toggleGroup(groupId: string) {
    this.settingsGroups.update((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g)),
    );
  }

  toggleAllItems(group: any) {
    group.items.forEach((item: any) => (item.status = group.masterToggle));
  }

  checkMasterStatus(group: any) {
    group.masterToggle = group.items.every((item: any) => item.status);
  }

  onDeleteAccount() {
    if (confirm('Huy có chắc chắn muốn xóa tài khoản không? Hành động này không thể hoàn tác.')) {
      console.log('Đã gửi yêu cầu xóa tài khoản');
    }
  }
}
