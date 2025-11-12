import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Processmember } from './processmember';

describe('Processmember', () => {
  let component: Processmember;
  let fixture: ComponentFixture<Processmember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Processmember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Processmember);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
