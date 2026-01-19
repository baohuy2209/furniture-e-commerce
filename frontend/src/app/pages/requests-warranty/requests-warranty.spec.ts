import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsWarranty } from './requests-warranty';

describe('RequestsWarranty', () => {
  let component: RequestsWarranty;
  let fixture: ComponentFixture<RequestsWarranty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsWarranty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestsWarranty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
