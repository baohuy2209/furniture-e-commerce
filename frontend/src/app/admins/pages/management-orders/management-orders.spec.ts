import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementOrders } from './management-orders';

describe('ManagementOrders', () => {
  let component: ManagementOrders;
  let fixture: ComponentFixture<ManagementOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementOrders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
