import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {JsUtil} from '../../universal/JsUtil';
import {AppInfoService} from '../../services/app-info.service';
import {ButtonEventData, ButtonModel, ButtonType, Gestures} from '../../universal/app.types';
import {PublishEvent, PubSubEventArgs, PubSubTopic} from '../../universal/pub-sub-types';
import {ComponentMappingService} from '../../services/component-mapping.service';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.css']
})
export class UiButtonComponent implements OnInit, AfterViewInit {
  objectId: number ;

  @ViewChild('mybutton') buttonRef: ElementRef;
  @Input('buttonModel') buttonModel: ButtonModel;
  @Input('borderRadius') borderRadius = '15%';

  buttonSize: string ;
  buttonHeight  = '100';
  imageHeight = '70px';
  actionSmallBorderRadius = '5px';
  lastClickTimeInMilliseconds = 0;
  @ViewChild(`placeholder`, { read: ViewContainerRef }) container;
  childComponentRef: ComponentRef<any>;

  constructor(public appInfo: AppInfoService,
              private componentFactoryResolver: ComponentFactoryResolver,
              private componentMappingService: ComponentMappingService) {
    this.objectId = JsUtil.getObjectId();
    // console.log('ctor.UiButtonComponent', this.objectId) ;
    this.buttonSize = this.appInfo.screenMetrics.buttonSize ;
  }

  ngAfterViewInit() {
    if (!this.buttonModel) {
      console.log('ERROR, UIButton, this.buttonModel is null');
      return;
    }
    this.loadComponent();

  }

  loadComponent() {
    const theType = this.componentMappingService.getComponentType(this.buttonModel.ButtonType);
    const factory = this.componentFactoryResolver.resolveComponentFactory(theType);

    this.childComponentRef = this.container.createComponent(factory);
    this.childComponentRef.instance.buttonModel = this.buttonModel;
    const buttonRef = this.childComponentRef.instance.buttonRef.nativeElement;
    this.prepareGestures(buttonRef);

  }

  ngOnInit() {
  }

  prepareGestures(buttonRef: any) {
    const self = this;
    // We create a manager object, which is the same as Hammer(), but without the presetted recognizers.
    // const mc = new Hammer.Manager(buttonElement);

    const mc = new Hammer.Manager(buttonRef);

    mc.add(new Hammer.Press({event: Gestures.press, pointers: 1, threshold: 9, time: 250}));

    if (this.buttonModel.behaviors.length === 1 && this.buttonModel.behaviors[0] === 'press') {
      mc.add(new Hammer.Press({event: Gestures.pressUp, time: 50000})); // time is timeout, will fire event if it timesout
    }

    // Tap recognizer with minimal 2 taps
    // mc.add(new Hammer.Tap({event: Gestures.doubletap, taps: 2}));

    // Single tap recognizer
    mc.add(new Hammer.Tap({event: Gestures.singletap}));

    // we want to recognize this simulatenous, so a quadrupletap will be detected even while a tap has been recognized.
    // mc.get(Gestures.doubletap).recognizeWith(Gestures.singletap);

    // we only want to trigger a tap, when we don't have detected a doubletap
    // mc.get(Gestures.singletap).requireFailure(Gestures.doubletap);

    mc.on(Gestures.allGestures, function (ev) {
     // console.log('**button gestures**', ev) ;
      self.onGestureEvent(ev);
    });
  }

  onClick() {
    const now = new Date();
    const currentClickInMilliseconds = now.getTime();
    const timeDiff =  currentClickInMilliseconds - this.lastClickTimeInMilliseconds ;

    // console.log('uibutton.onClick',this.objectId);

    if (timeDiff < 401) {
      // it's a double click, it's going to get selected
      this.buttonModel.IsSelected = true ;

    } else {
      this.buttonModel.IsSelected = !this.buttonModel.IsSelected;
    }
    this.lastClickTimeInMilliseconds = now.getTime() ;

    // console.log('uibutton.publish', this.buttonModel.objectId) ;

    // driveThruView catches this and applies business rules across all buttons
    const data = new ButtonEventData('click', this.buttonModel, this.objectId) ;
    const e = new PubSubEventArgs(PubSubTopic.buttonSelect, data, this.objectId) ;
    this.appInfo.pubsub.publishUsingEventArgs(e);
  }

  onGestureEvent(e: any) {
    // console.log('=== on gesture ===', e);
    this.buttonModel.gesture = e.type;
    this.buttonModel.Tag = e;

    const data = new ButtonEventData(e.type, this.buttonModel, this.objectId, e) ;

    PublishEvent.Create(PubSubTopic.buttonGesture, this.objectId)
      .SetDataArgumentTo(data)
      .Send();
  }



}
