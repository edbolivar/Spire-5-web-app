import { TestBed, inject } from '@angular/core/testing';

import { AdaNavigationService } from './ada-navigation.service';

describe('AdaNavigationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdaNavigationService]
    });
  });

  it('should be created', inject([AdaNavigationService], (service: AdaNavigationService) => {
    expect(service).toBeTruthy();
  }));
});
