import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementWarranty } from './management-warranty';

describe('ManagementWarranty', () => {
  let component: ManagementWarranty;
  let fixture: ComponentFixture<ManagementWarranty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementWarranty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementWarranty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
