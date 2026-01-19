import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogsDetails } from './blogs-details';

describe('BlogsDetails', () => {
  let component: BlogsDetails;
  let fixture: ComponentFixture<BlogsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogsDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogsDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
