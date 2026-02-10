import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule, CommonModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  current_password: string = '';
  new_password: string = '';
  confirm_password: string = '';
  validationNewPassword(password: string): number {
    let number = 0;
    if (password.length < 8) {
      number = 1;
      return number;
    } else if (!/[A-Z]/.test(password)) {
      number = 2;
      return number;
    } else if (!/[a-z]/.test(password)) {
      number = 3;
      return number;
    } else if (!/\d/.test(password)) {
      number = 4;
      return number;
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      number = 5;
      return number;
    }
    return number;
  }
  isVerified(password: string, confirm_password: string): boolean {
    return password == confirm_password;
  }
}
