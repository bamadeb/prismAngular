import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestRiskProfile } from './latest-risk-profile';

describe('LatestRiskProfile', () => {
  let component: LatestRiskProfile;
  let fixture: ComponentFixture<LatestRiskProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatestRiskProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LatestRiskProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
