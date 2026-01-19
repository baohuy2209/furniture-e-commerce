import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementCustomers } from './management-customers';

describe('ManagementCustomers', () => {
  let component: ManagementCustomers;
  let fixture: ComponentFixture<ManagementCustomers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementCustomers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementCustomers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
