import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fileprocesslogreport } from './fileprocesslogreport';

describe('Fileprocesslogreport', () => {
  let component: Fileprocesslogreport;
  let fixture: ComponentFixture<Fileprocesslogreport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fileprocesslogreport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fileprocesslogreport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
