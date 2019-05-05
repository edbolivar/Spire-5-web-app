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
  pswipeCount: number;
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

    this.pswipeCount = 0;
    // since we turned zone's off, we need this to force the screen to draw when we
    // are routing from blocker
    setTimeout(() => {
      app.tick();
    }, 250);
  }

  ngOnInit() {
    console.log('OnInit.pixi-container');
    const self = this;
    
    // put a ?brands=COUNTOFBrands to test different
    // layouts
    this.route.queryParams
       .subscribe(params => {
         if (params.brands) {
            self.appInfo.numberOfBrands=params.brands;
            console.log("==> using test brand count:", params.brands);       
         }
      });

    if (this.appInfo.isBlocker && !this.appInfo.hasBlocked) {
      console.log('navigate to blocker');
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
    console.log('AfterViewInit.pixi-container');
    this.changeDetector.detectChanges();
  }

  ngOnDestroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }

  onDataReady(e: ConfigurationData) {
    // ToDo: so we have platform
    this.appInfo.ConfigurationData = e;
    console.log('==> data arrived in pixi container', e);

    const font = new FontFaceObserver('Booster Next FY Regular');
    font.load().then(
      () => {
        console.log('fonts loaded');
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
    if (this.eventFlag === true) {
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

  @HostListener('mouseup')
  onMouseup() {
    this.isMouseDown = false;
    let gesture: String;
    gesture = this.gestureRecorder.stopRecording();

    if (this.pswipeCount < 1 && gesture === 'P') {
      this.pswipeCount++;
      // blur screen
      PublishEvent.Create(PubSubTopic.vibrateBody, this.objectId).Send();
    } else if (this.pswipeCount === 1) {
      PublishEvent.Create(PubSubTopic.showPinpad, this.objectId).Send();
      this.pswipeCount = 0;
      this.eventFlag = false;
    }
  }
  
  @HostListener('document:keydown', ['$event'])
  handleDownKeyboardEvent(event: KeyboardEvent) {
    
    PublishEvent.Create(PubSubTopic.notifyKeyEvent,this.objectId)
                .SetDataArgumentTo(event)
                .Send();
  }

  @HostListener('document:keyup', ['$event'])
  handleUpKeyboardEvent(event: KeyboardEvent) {

    PublishEvent.Create(PubSubTopic.notifyKeyEvent,this.objectId)
                .SetDataArgumentTo(event)
                .Send();
  }
  // private loadConfigFiles(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.addLogMessage('Loading config files');
  //     Config.loadFrom('./assets/config/config.json', this.generateSubstitutionsFromQueryStrings(), (filesLoaded, filesLoading) => {
  //       const loadingMessage = `Loading config files (${filesLoaded.length}/${filesLoading.length + filesLoaded.length})
  //       ${filesLoaded.length > 0
  //         ? filesLoaded[filesLoaded.length - 1]
  //         : ''}`
  //       this.setLogMessage(loadingMessage);
  //     }).then(() => {
  //       this.setLogMessage('Config files loaded.');
  //       resolve();
  //     }).catch((e) => {
  //       const errorMessage = `Error loading ${e.filename}: ${e.error}`;
  //       this.setLogMessage(errorMessage);
  //       reject(errorMessage);
  //     });
  //   });
  // }
  // private addLogMessage(message: string) {
  //   this._loadingMessages.push(message);
  //   console.log(message);
  //   this.renderLogMessages();
  // }

  // private setLogMessage(message: string) {
  //   this._loadingMessages[Math.max(this._loadingMessages.length - 1, 0)] = message;
  //   console.log(`...${message}`);
  //   this.renderLogMessages();
  // }

  // private renderLogMessages() {
  //   this.getContainer().innerHTML = this._loadingMessages.join('<br/>');
  // }

  // private generateSubstitutionsFromQueryStrings() {
  //   // Generates a list of objects that can replace the config settings from query strings
  //   return queryString.parse(location.search);
  // }
}
