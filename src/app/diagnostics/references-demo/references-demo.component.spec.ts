/* tslint:disable:no-unused-variable */

import { By }           from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { addProviders, async, inject } from '@angular/core/testing';
import { ReferencesDemoComponent } from './references-demo.component';

describe('Component: ReferencesDemo', () => {
  it('should create an instance', () => {
    let component = new ReferencesDemoComponent();
    expect(component).toBeTruthy();
  });
});
