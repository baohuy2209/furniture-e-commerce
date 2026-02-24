import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSidebar } from './settings-sidebar';

describe('SettingsSidebar', () => {
  let component: SettingsSidebar;
  let fixture: ComponentFixture<SettingsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
