import {Sprite, ticker} from 'pixi.js';
import AppRoutes from '../display/navigation/AppRoutes';
import Box from '../display/shapes/Box';
import Navigator from '../display/navigation/Navigator';
import {AppInfoService} from '../services/app-info.service';
import {OutOfOrderEventArgs, PlatformModel, ApiResult, DeviceInfo} from '../universal/app.types';
import {PubSubEventArgs, PubSubTopic, SubscribeEvent, PublishEvent} from '../universal/pub-sub-types';
import {JsUtil} from '../universal/JsUtil';
import { GestureRecorder } from '../utils/GestureRecorder';
import { PixiColors } from '../utils/PixiColors';
import { IdleToHomeTransition } from './navigation/IdleToHomeTransition';
import { IdleTransition } from './navigation/IdleTransition';

export default class Main extends Sprite {

  private _navigator: Navigator;
  private _finished: boolean;
  private _appInfo: AppInfoService;
  private _platform: PlatformModel;
  private objectId: number;
  private _gestureRecorder: GestureRecorder ;
  private _outOfOrder: boolean;
  _dismissTimer;

  constructor(appInfo: AppInfoService) {
    super();
    this.objectId = JsUtil.getObjectId();
    const self = this;

    this._appInfo = appInfo;
    this._platform = appInfo.ConfigurationData.platform;
    this._outOfOrder = false;

    // Main navigation holder (includes all screens)
    const route = appInfo.ConfigurationData.isValidConfig ? AppRoutes.getHome() :  AppRoutes.getOutOfOrder();
    if(DeviceInfo.unitState.UnitType === "Unattended") {
      this._navigator = new Navigator(AppRoutes.createRouter(this._appInfo), AppRoutes.getScanPage());
      SubscribeEvent.Create(PubSubTopic.authorized, this.objectId)
      .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
        self.goToHomePage();
      }).Done();
    } else {    
      this._navigator = new Navigator(AppRoutes.createRouter(this._appInfo), route);
    }
    this.addChild(this._navigator);

    this._finished = false;

    // Create hidden interface to get to service ui
    const viewWidth = this._platform.width;
    const box = new Box(PixiColors.Cyan, viewWidth * 0.1, viewWidth * 0.1);
    box.x = viewWidth - box.width;
    box.alpha = 0; // not visible at all
    box.interactive = true;
    box.on('click', () => {
      if (!this._finished) { this.quit(); }
    });
    this.addChild(box);

    // Wait for keys (Alt+F12)
    document.addEventListener('keydown', (e) => {
      if (!this._finished) {
        if (e.code === 'F12' && e.altKey) {
          e.preventDefault();
          this.quit();
        }
      }
    });


    SubscribeEvent.Create(PubSubTopic.outOfOrderChanged, this.objectId)
      .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
        self.handleOutOfOrder(e.data);
      }).Done();
  }

  handleOutOfOrder(e: OutOfOrderEventArgs) {
    if (this._outOfOrder === e.isOutOfOrder) { 
      return;
    }
    this._outOfOrder = e.isOutOfOrder;
    console.log('Out Of Order');
    console.log(this._outOfOrder);
    if (this._outOfOrder || this._appInfo.ConfigurationData.pourables.pourMenu.length === 0) {
      this._navigator.goTo(AppRoutes.getOutOfOrder(), e, new IdleTransition() );
    } else {
      this._navigator.goTo(AppRoutes.getHome(), null, new IdleToHomeTransition());
    }  
  }

  goToHomePage(){
    console.log("authorized");
    this._navigator.goTo(AppRoutes.getHome(), null, new IdleToHomeTransition());
  }

  private quit() {
    console.log('Exit To ServiceUi, Shortcut');
    const apiResult = new ApiResult();
    apiResult.Success = true ;
    apiResult.Details.push('Role=Super');
    PublishEvent.Create(PubSubTopic.switchToServiceUI, this.objectId)
      .SetDataArgumentTo(apiResult)
      .Send();
  }
}
