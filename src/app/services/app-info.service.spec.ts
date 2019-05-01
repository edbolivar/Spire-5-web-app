/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { AppInfoService } from './app-info.service';

describe('Service: appInfo', () => {
  beforeEach(() => {
    addProviders([AppInfoService]);
  });

  it('should ...',
    inject([AppInfoService],
      (service: AppInfoService) => {
        expect(service).toBeTruthy();
      }));
});
