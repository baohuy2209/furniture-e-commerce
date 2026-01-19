import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportCustomers } from './support-customers';

describe('SupportCustomers', () => {
  let component: SupportCustomers;
  let fixture: ComponentFixture<SupportCustomers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportCustomers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportCustomers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
