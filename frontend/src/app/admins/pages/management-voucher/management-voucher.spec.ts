import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementVoucher } from './management-voucher';

describe('ManagementVoucher', () => {
  let component: ManagementVoucher;
  let fixture: ComponentFixture<ManagementVoucher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementVoucher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementVoucher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
