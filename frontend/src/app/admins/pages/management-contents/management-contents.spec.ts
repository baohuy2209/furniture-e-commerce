import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementContents } from './management-contents';

describe('ManagementContents', () => {
  let component: ManagementContents;
  let fixture: ComponentFixture<ManagementContents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementContents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementContents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
