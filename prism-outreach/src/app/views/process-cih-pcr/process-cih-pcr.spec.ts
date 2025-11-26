import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessCihPcr } from './process-cih-pcr';

describe('ProcessCihPcr', () => {
  let component: ProcessCihPcr;
  let fixture: ComponentFixture<ProcessCihPcr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessCihPcr]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessCihPcr);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
