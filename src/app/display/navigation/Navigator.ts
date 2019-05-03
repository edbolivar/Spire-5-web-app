// import { Sprite, ticker } from "pixi.js";
//
// import AbstractScreen from "display/navigation/AbstractScreen";
// import MiniRouter from "routing/MiniRouter";

import Sprite = PIXI.Sprite;
import MiniRouter from '../../../routing/MiniRouter';
import AbstractScreen from './AbstractScreen';
import {PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../../universal/pub-sub-types';
import {JsUtil} from '../../universal/JsUtil';
import {OutOfOrderEventArgs} from '../../universal/app.types';

export default class Navigator extends Sprite {

  private _router: MiniRouter<AbstractScreen>;
  private _currentScreen?: AbstractScreen;
  private _currentRoute?: string;

  constructor(router: MiniRouter<AbstractScreen>, startRoute: string) {
    super();

    this._router = router;
    this.goTo(startRoute);
  }

  public goTo(newRoute: string, param?: any) {
    console.log(`[Navigator] Navigating to [${newRoute}]`);
    const newScreen = this._router.handle(newRoute, param);
    if (newScreen) {
      newScreen.navigator = this;

      if (this._currentScreen) {
        // Must hide current screen first
        this.hideScreen(this._currentScreen, newRoute).then(() => {
          this.showScreen(newScreen, newRoute);
        });
      } else {
        // Just show the new one
        this.showScreen(newScreen, newRoute);
      }
    } else {
      console.warn('Could not resolve route', newRoute);
    }
  }

  private showScreen(screen: AbstractScreen, route: string) {
    return new Promise((resolve, reject) => {
      this._currentScreen = screen;
      this._currentRoute = route;
      this.addChild(screen);
      screen.prepare().then(() => {
        screen.show(this._currentRoute).then(() => {
          resolve();
        });
      });
    });
  }

  private hideScreen(screen: AbstractScreen, toRoute: string): Promise<void> {
    return new Promise((resolve, reject) => {
      screen.hide(toRoute).then(() => {
        this.removeChild(screen);
        screen.destroy();
        resolve();
      });
    });
  }
}
