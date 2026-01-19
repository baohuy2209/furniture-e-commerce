import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementProducts } from './management-products';

describe('ManagementProducts', () => {
  let component: ManagementProducts;
  let fixture: ComponentFixture<ManagementProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
