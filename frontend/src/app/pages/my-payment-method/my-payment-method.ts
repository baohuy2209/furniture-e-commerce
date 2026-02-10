import { Component } from '@angular/core';

@Component({
  selector: 'app-my-payment-method',
  imports: [],
  templateUrl: './my-payment-method.html',
  styleUrl: './my-payment-method.css',
})
export class MyPaymentMethod {
  user = {
    name: 'Nguyễn Bảo Huy',
    expired_card: '20/12/2030',
    card_number: '4562  1122  4594  7852',
  };
}
