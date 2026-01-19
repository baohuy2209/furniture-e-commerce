import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDashboard } from './general-dashboard';

describe('GeneralDashboard', () => {
  let component: GeneralDashboard;
  let fixture: ComponentFixture<GeneralDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
