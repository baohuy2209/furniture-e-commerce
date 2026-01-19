import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPromotions } from './my-promotions';

describe('MyPromotions', () => {
  let component: MyPromotions;
  let fixture: ComponentFixture<MyPromotions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPromotions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPromotions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
