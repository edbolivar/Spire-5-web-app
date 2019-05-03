import {Sprite, ticker} from 'pixi.js';
import AppRoutes from '../display/navigation/AppRoutes';
import Box from '../display/shapes/Box';
import Navigator from '../display/navigation/Navigator';
import {AppInfoService} from '../services/app-info.service';
import {OutOfOrderEventArgs, Platform} from '../universal/app.types';
import {PubSubEventArgs, PubSubTopic, SubscribeEvent, PublishEvent} from '../universal/pub-sub-types';
import {JsUtil} from '../universal/JsUtil';
import { GestureRecorder } from '../utils/GestureRecorder';

export default class Main extends Sprite {

  private _navigator: Navigator;
  private _finished: boolean;
  private _appInfo: AppInfoService;
  private _platform: Platform;
  private objectId: number;
  private _gestureRecorder: GestureRecorder ;

  constructor(appInfo: AppInfoService) {
    super();

    this._appInfo = appInfo;
    this._platform = appInfo.ConfigurationData.platform;

    // Main navigation holder (includes all screens)
    this._navigator = new Navigator(AppRoutes.createRouter(this._appInfo), AppRoutes.getHome());
    this.addChild(this._navigator);

    this._finished = false;

    // asked zeh the question 6/18/2018, when we new it up, it causes the pourpage visual artifact
//    this._gestureRecorder = new GestureRecorder();

    // Create hidden interface
    const viewWidth = this._platform.width;
    const box = new Box(0xff0000, viewWidth * 0.1, viewWidth * 0.1);
    box.x = viewWidth - box.width;
    box.alpha = 0;
    box.interactive = true;
    box.on('click', () => {
      if (!this._finished) { this.quit(); }
    });
    this.addChild(box);

    // Wait for keys
    document.addEventListener('keydown', (e) => {
      if (!this._finished) {
        if (e.code === 'F12' && e.altKey) {
          e.preventDefault();
          this.quit();
        }
      }
    });

    this.objectId = JsUtil.getObjectId();

    const self = this;

    SubscribeEvent.Create(PubSubTopic.outOfOrderChanged, this.objectId)
      .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
        self.handleOutOfOrder(e.data);
      }).Done();
  }

  handleOutOfOrder(e: OutOfOrderEventArgs) {
    if (e.isOutOfOrder) {
      this._navigator.goTo(AppRoutes.getOutOfOrder(), e);
    } else {
      this._navigator.goTo(AppRoutes.getHome());
    }
  }

  private quit() {
    console.log('Quitting...,');
    this._finished = true;
    PublishEvent.Create(PubSubTopic.switchToServiceUI, this.objectId)
      .Send();
    // this.destroy();
  }
}
