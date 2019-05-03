import {Sprite} from 'pixi.js';

import Navigator from './Navigator';
import {AppInfoService} from '../../services/app-info.service';
import {IdleState, Platform} from '../../universal/app.types';

export default class AbstractScreen extends Sprite {

  private _navigator: Navigator;
  public appInfo: AppInfoService;
  public Platform: Platform;
  public idleState: IdleState;

  constructor(appInfo: AppInfoService) {
    super();
    this.appInfo = appInfo;
    this.Platform = appInfo.ConfigurationData.platform;
    this.idleState = appInfo.ConfigurationData.idleState;
  }

  public get navigator() {
    return this._navigator;
  }

  public set navigator(navigator: Navigator) {
    this._navigator = navigator;
  }

  public prepare(): Promise<void> {
    return Promise.resolve();
  }

  public show(previousRoute?: string): Promise<void> {
    return Promise.resolve();
  }

  public hide(nextRoute?: string): Promise<void> {
    return Promise.resolve();
  }

  public destroy() {
    super.destroy();
  }
}

