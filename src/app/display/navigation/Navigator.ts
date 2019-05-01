import { Sprite, Texture } from 'pixi.js';
import MiniRouter from '../../../routing/MiniRouter';
import AbstractScreen from './AbstractScreen';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import FweenSequence from '../../../transitions/fween/default/FweenSequence';
import { Transition } from './Transition';
import { IdleTransition } from './IdleTransition';
import { IdleToHomeTransition } from './IdleToHomeTransition';

export default class Navigator extends Sprite {
  private _router: MiniRouter<AbstractScreen>;
  private _currentScreen?: AbstractScreen;
  private _previousScreen?: AbstractScreen;
  private _currentRoute?: string;
  private _transition?: Transition;
  private _transitionProgress?: number;
  private _transitionFween?: FweenSequence;
  private _screenLayer: Sprite;
  // private _debugOverlayLayer: Sprite;
  // private _debugOverlay: Sprite;

  constructor(router: MiniRouter<AbstractScreen>, startRoute: string) {
    super();

    this._screenLayer = new Sprite();
    this.addChild(this._screenLayer);

    
    // debug overlay
    //
    // this._debugOverlayLayer = new Sprite();
    // this._debugOverlayLayer.interactive = false;
    // this._debugOverlayLayer.alpha = 0.5;
    // this.addChild(this._debugOverlayLayer);
    //
    // this._debugOverlay = new Sprite(Texture.fromImage('assets/overlay/brand-mix-ada.png'));
    // this._debugOverlayLayer.addChild(this._debugOverlay);
    // this._debugOverlayLayer.alpha = 0.4;

    this._router = router;
    this.goTo(startRoute);
  }

  public get transition() {
    return this._transition;
  }

  public get transitionProgress() {
    return this._transitionProgress;
  }

  public set transitionProgress(transitionProgress: number) {
    if (this._transitionProgress !== transitionProgress) {
      this._transitionProgress = transitionProgress;
      this.redrawTransition();
    }
  }

  private async redrawTransition() {
    const progress = this._transitionProgress;

    if (this._previousScreen) {
      this._previousScreen.transition(1 - progress);
    }

    if (this._currentScreen) {
      this._currentScreen.transition(progress);
    }

    if (progress === 1) {
      if (this._previousScreen) {
        await this.hideScreen(this._previousScreen, this._currentRoute);
        delete this._previousScreen;
      }

      if (this._currentScreen) {
        this._currentScreen.show(this._currentRoute);
      }

      delete this._transitionFween;
    }
  }

  public async goTo(newRoute: string, param?: any, transition?: any) {
    const newScreen = this._router.handle(newRoute, param);

    if (this._transition) {
      delete this._transition;
    }

    if (this._transitionFween) {
      this._transitionFween.stop();
      delete this._transitionFween;
    }

    if (this._previousScreen) {
      // end any previous transition immediately
      await this.hideScreen(this._previousScreen, this._currentRoute);
      delete this._previousScreen;
    }

    if (newScreen) {
      newScreen.navigator = this;

      if (this._currentScreen) {
        await this._currentScreen.prepareToHide();
      }

      this._previousScreen = this._currentScreen;
      this._currentScreen = newScreen;
      this._currentRoute = newRoute;
      this._transition = transition;

      this._screenLayer.addChild(newScreen);
      await newScreen.prepareToShow();
      
      let duration;
      if (transition instanceof IdleTransition) {
        duration = 0.75;
      } else if (transition instanceof IdleToHomeTransition) {
        duration = 1.25;
      } else {
        duration = 1.5;
      }

      this._transitionProgress = 0;
      this._transitionFween = Fween.use(this).to(
        { transitionProgress: 1 },
        duration,
        Easing.quadOut
      );

      this._transitionFween.play();
    } else {
      console.warn('Could not resolve route', newRoute);
    }
  }

  private async hideScreen(screen: AbstractScreen, toRoute: string) {
    await screen.hide(toRoute);

    this._screenLayer.removeChild(screen);
    screen.destroy();
  }
}
