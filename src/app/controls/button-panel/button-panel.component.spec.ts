import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonPanelComponent } from './button-panel.component';

describe('ButtonPanelComponent', () => {
  let component: ButtonPanelComponent;
  let fixture: ComponentFixture<ButtonPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
