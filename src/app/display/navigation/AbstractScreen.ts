import { Sprite } from 'pixi.js';
import Navigator from './Navigator';
import { AppInfoService } from '../../services/app-info.service';
import { IdleState, PlatformModel } from '../../universal/app.types';

export default class AbstractScreen extends Sprite {
  private _navigator: Navigator;
  public appInfo: AppInfoService;
  public Platform: PlatformModel;
  public idleState: IdleState;

  static _instance: AbstractScreen;

  constructor(appInfo: AppInfoService) {
    super();
    this.appInfo = appInfo;
    this.Platform = appInfo.ConfigurationData.platform;
    this.idleState = appInfo.ConfigurationData.idleState;
    AbstractScreen._instance = this;
  }

  public get navigator() {
    return this._navigator;
  }

  public set navigator(navigator: Navigator) {
    this._navigator = navigator;
  }

  public prepareToShow(): Promise<void> {
    return Promise.resolve();
  }

  public prepareToHide(): Promise<void> {
    return Promise.resolve();
  }

  public show(previousRoute?: string): Promise<void> {
    return Promise.resolve();
  }

  public transition(transitionInfluence: number) {
    return Promise.resolve();
  }

  public hide(nextRoute?: string): Promise<void> {
    return Promise.resolve();
  }

  public destroy() {
    AbstractScreen._instance = null;
    super.destroy();
  }
}
