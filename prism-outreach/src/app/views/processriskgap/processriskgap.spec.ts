import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Processriskgap } from './processriskgap';

describe('Processriskgap', () => {
  let component: Processriskgap;
  let fixture: ComponentFixture<Processriskgap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Processriskgap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Processriskgap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
