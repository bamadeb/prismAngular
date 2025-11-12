import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Starperformance } from './starperformance';

describe('Starperformance', () => {
  let component: Starperformance;
  let fixture: ComponentFixture<Starperformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Starperformance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Starperformance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
