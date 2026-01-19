import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementEvents } from './management-events';

describe('ManagementEvents', () => {
  let component: ManagementEvents;
  let fixture: ComponentFixture<ManagementEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
