import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockerComponent } from './blocker.component';

describe('BlockerComponent', () => {
  let component: BlockerComponent;
  let fixture: ComponentFixture<BlockerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
