import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActionModal } from './add-action-modal';

describe('AddActionModal', () => {
  let component: AddActionModal;
  let fixture: ComponentFixture<AddActionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddActionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddActionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
