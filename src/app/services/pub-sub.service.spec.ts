/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { PubSubService } from '../universal/pub-sub.service';

describe('Service: PubSub', () => {
  beforeEach(() => {
    addProviders([PubSubService]);
  });

  it('should ...',
    inject([PubSubService],
      (service: PubSubService) => {
        expect(service).toBeTruthy();
      }));
});
