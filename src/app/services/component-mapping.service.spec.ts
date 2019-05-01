import { TestBed, inject } from '@angular/core/testing';

import { ComponentMappingService } from './component-mapping.service';

describe('ComponentMappingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComponentMappingService]
    });
  });

  it('should be created', inject([ComponentMappingService], (service: ComponentMappingService) => {
    expect(service).toBeTruthy();
  }));
});
