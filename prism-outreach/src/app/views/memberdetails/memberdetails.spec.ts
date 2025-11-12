import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Memberdetails } from './memberdetails';

describe('Memberdetails', () => {
  let component: Memberdetails;
  let fixture: ComponentFixture<Memberdetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Memberdetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Memberdetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
