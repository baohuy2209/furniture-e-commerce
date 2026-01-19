import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementWarehouse } from './management-warehouse';

describe('ManagementWarehouse', () => {
  let component: ManagementWarehouse;
  let fixture: ComponentFixture<ManagementWarehouse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementWarehouse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementWarehouse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
