import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PinpadComponent } from './pinpad.component';

describe('PinpadComponent', () => {
  let component: PinpadComponent;
  let fixture: ComponentFixture<PinpadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PinpadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PinpadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
