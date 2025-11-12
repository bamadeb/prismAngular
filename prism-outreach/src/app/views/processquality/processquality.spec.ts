import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Processquality } from './processquality';

describe('Processquality', () => {
  let component: Processquality;
  let fixture: ComponentFixture<Processquality>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Processquality]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Processquality);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
