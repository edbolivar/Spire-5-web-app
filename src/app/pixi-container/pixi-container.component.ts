import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  AfterViewInit,
  ApplicationRef,
  HostListener
} from '@angular/core';
import {
  Application,
  RendererOptions
} from 'pixi.js';

import PixiPatches from '../utils/PixiPatches';
import Main from '../display/Main';
import {
  PubSubTopic,
  SubscribeEvent,
  PublishEvent
} from '../universal/pub-sub-types';
import { JsUtil } from '../universal/JsUtil';
import { ConfigurationData } from '../universal/app.types';
import { AppInfoService } from '../services/app-info.service';
import { GestureRecorder } from '../utils/GestureRecorder';
import * as FontFaceObserver from 'fontfaceobserver';
import { ActivatedRoute } from '@angular/router';
import { AdaNavigationService } from '../services/ada-navigation.service';
import { PinpadComponent } from '../controls/pinpad/pinpad.component';

@Component({
  selector: 'app-pixi-container',
  templateUrl: './pixi-container.component.html',
  styleUrls: ['./pixi-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PixiContainerComponent
  implements OnInit, OnDestroy, AfterViewInit {
  objectId: number;
  private _app: Application;
  isMouseDown = false;
  gestureRecorder: GestureRecorder = new GestureRecorder();
  eventFlag: Boolean = true; // set the Mouse Event

  private _renderOptions: RendererOptions = {
    backgroundColor: 0xffffff,
    antialias: true,
    powerPreference: true,
    forceCanvas: true,
    legacy: true
  };

  constructor(
    public appInfo: AppInfoService,
    private changeDetector: ChangeDetectorRef,
    private app: ApplicationRef,
    private route: ActivatedRoute,
    private adaNavigationService: AdaNavigationService
  ) {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.pixi-container');
    
    // add to appInfo for reference later
    this.appInfo.adaNavigationService = this.adaNavigationService;

    // since we turned zone's off, we need this to force the screen to draw when we
    // are routing from blocker
    setTimeout(() => {
      app.tick();
    }, 250);
  }

  ngOnInit() {
   
    const self = this;
    
    if (this.appInfo.isBlocker && !this.appInfo.hasBlocked) {
     
      this.appInfo.navigateToPage('blocker');
      return;
    }

    SubscribeEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
      .HandleEventWithThisMethod(e => self.onDataReady(e.data))
      .Done();

    SubscribeEvent.Create(PubSubTopic.vibrateBody, this.objectId)
      .HandleEventWithThisMethod(e => self.animateBody(e.data))
      .Done();
  }
  
  ngAfterViewInit() {
    this.changeDetector.detectChanges();
  }

  ngOnDestroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }

  onDataReady(e: ConfigurationData) {
    this.appInfo.ConfigurationData = e;

    const font = new FontFaceObserver('Booster Next FY Regular');
    font.load().then(
      () => {
        this.startPixiContainer();

        this.changeDetector.detectChanges();
      },
      err => {
        console.error('fonts failed', err);
      }
    );
  }

  private animateBody(e: ConfigurationData) {
    // more fun when it moves
    let count = 0;
    this._app.ticker.add(() => {
      if (count === 0) {
        this._app.ticker.start();
      }

      if (count < 30) {
        this._app.stage.alpha -= 0.05;
        count++;
      } else if (count >= 30 && count < 60) {
        this._app.stage.alpha += 0.05;
        count++;
      } else {
        this._app.ticker.remove(() => {
          this._app.ticker.stop();
          count = 0;
        });
      }
    });
    // render the container
  }

  private startPixiContainer() {
    // Patches PIXI defects
    PixiPatches.patchAll();

    // Instantiates application
    this._app = new Application(
      this.appInfo.ConfigurationData.platform.width,
      this.appInfo.ConfigurationData.platform.height
    );

    this._app.renderer = PIXI.autoDetectRenderer(
      this.appInfo.ConfigurationData.platform.width,
      this.appInfo.ConfigurationData.platform.height,
      this._renderOptions
    );

    this.appInfo.renderer = this._app.renderer;

    this.getContainer().innerHTML = '';
    this.getContainer().appendChild(this._app.view);

    const main = new Main(this.appInfo);
    this._app.stage.addChild(main);
  }

  private getContainer(): HTMLElement {
    const element = document.getElementById('pixidiv');
    return element ? element : document.body;
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event) {
    this.isMouseDown = true;
    if (this.eventFlag === true && PinpadComponent._instance.isOpen === false) {
      this.gestureRecorder.startRecording(event);
    }
  }

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    if (!this.isMouseDown) {
      return;
    }
    if (this.eventFlag === true) {
      this.gestureRecorder.recordPoint(event);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseup(event: MouseEvent) {
    this.isMouseDown = false;
    let gesture: String;
    gesture = this.gestureRecorder.stopRecording();
    this.gestureRecorder.getGestureWidthAndHeight();

    if ( this.appInfo.pswipeCount < 1 && gesture === 'P' && this.gestureRecorder.gestureWidth > 200 && this.gestureRecorder.gestureHeight > 200 ) {
      this.appInfo.pswipeCount++;
      // blur screen
      PublishEvent.Create(PubSubTopic.vibrateBody, this.objectId).Send();
    } else if (this.appInfo.pswipeCount === 1 && gesture === 'P' && this.gestureRecorder.gestureWidth > 200 && this.gestureRecorder.gestureHeight > 200 && this.appInfo.isPinPassed === false) {
      PublishEvent.Create(PubSubTopic.showPinpad, this.objectId).Send();
      this.eventFlag = false;
    } else if ((this.gestureRecorder.gestureWidth < 200 || this.gestureRecorder.gestureHeight < 200) && gesture === 'P') {
      // console.log('Gesture height/width should be more than 200px');
    } else if (PinpadComponent._instance.isOpen === true && event.toElement.childNodes.length === 0) {
     
      PinpadComponent._instance.showConsumerUI();
      this.appInfo.pswipeCount = 0;
      this.eventFlag = true;
    }
  
  }

  @HostListener('document:keydown', ['$event'])
  handleDownKeyboardEvent(event: KeyboardEvent) {
    
    PublishEvent.Create(PubSubTopic.notifyKeyEvent, this.objectId)
                .SetDataArgumentTo(event)
                .Send();
  }

  @HostListener('document:keyup', ['$event'])
  handleUpKeyboardEvent(event: KeyboardEvent) {

    PublishEvent.Create(PubSubTopic.notifyKeyEvent, this.objectId)
                .SetDataArgumentTo(event)
                .Send();
  }
}
