import { TestBed } from '@angular/core/testing';

import { Logreport } from './logreport';

describe('Logreport', () => {
  let service: Logreport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Logreport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
