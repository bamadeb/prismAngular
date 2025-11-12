import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gapsreport } from './gapsreport';

describe('Gapsreport', () => {
  let component: Gapsreport;
  let fixture: ComponentFixture<Gapsreport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gapsreport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gapsreport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
