import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderProfile } from './header-profile';

describe('HeaderProfile', () => {
  let component: HeaderProfile;
  let fixture: ComponentFixture<HeaderProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
