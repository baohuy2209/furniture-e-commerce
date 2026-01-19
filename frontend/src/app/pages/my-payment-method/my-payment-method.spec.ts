import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPaymentMethod } from './my-payment-method';

describe('MyPaymentMethod', () => {
  let component: MyPaymentMethod;
  let fixture: ComponentFixture<MyPaymentMethod>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPaymentMethod]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPaymentMethod);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
