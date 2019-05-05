import Sprite = PIXI.Sprite;
import MiniRouter from '../../../routing/MiniRouter';
import AbstractScreen from './AbstractScreen';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import FweenSequence from '../../../transitions/fween/default/FweenSequence';
import { Transition } from './Transition';

export default class Navigator extends Sprite {
  private _router: MiniRouter<AbstractScreen>;
  private _currentScreen?: AbstractScreen;
  private _previousScreen?: AbstractScreen;
  private _currentRoute?: string;
  private _transition?: Transition;
  private _transitionProgress?: number;
  private _transitionFween?: FweenSequence;

  constructor(router: MiniRouter<AbstractScreen>, startRoute: string) {
    super();

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
    console.log(`[Navigator] Navigating to [${newRoute}]`, param, transition);
    const newScreen = this._router.handle(newRoute, param);

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

      this.addChild(newScreen);
      await newScreen.prepareToShow();

      this._transitionProgress = 0;
      this._transitionFween = Fween.use(this).to(
        { transitionProgress: 1 },
        1.5,
        Easing.quadOut
      );
      this._transitionFween.play();
    } else {
      console.warn('Could not resolve route', newRoute);
    }
  }

  private async hideScreen(screen: AbstractScreen, toRoute: string) {
    await screen.hide(toRoute);

    this.removeChild(screen);
    screen.destroy();
  }
}
