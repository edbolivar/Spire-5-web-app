import { TestBed, inject } from '@angular/core/testing';

import { SocketClient } from './socket.client';

describe('SocketClient', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SocketClient]
    });
  });

  it('should be created', inject([SocketClient], (service: SocketClient) => {
    expect(service).toBeTruthy();
  }));
});
