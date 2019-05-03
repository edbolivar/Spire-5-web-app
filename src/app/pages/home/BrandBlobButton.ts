import Sprite = PIXI.Sprite;
import ticker = PIXI.ticker;
import BlobShape from '../../display/shapes/BlobShape';
import StringUtils from '../../utils/StringUtils';
import Texture = PIXI.Texture;
import LegacyAnimatedSprite from '../../display/components/LegacyAnimatedSprite';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import {map} from 'moremath';
import SimpleSignal from 'simplesignal';
import {PourableDesign} from '../../universal/app.types';
import {JsUtil} from '../../universal/JsUtil';
import {AppInfoService} from '../../services/app-info.service';

export default class BrandBlobButton extends Sprite {
  public static readonly ASSUMED_RADIUS = 128;
  objectId: number ;
  private _radius: number;
  private _rotationSpeed: number;
  private _internalScale: number;
  private _container: Sprite;
  private _logo: Sprite;
  private _stroke: BlobShape;
  private _gradient: Sprite;
  private _gradientMask: BlobShape;
  private _bubbles: LegacyAnimatedSprite;
  private _pressedPhase: number;
  private _onTapped = new SimpleSignal<(instance: BrandBlobButton) => void>();

  constructor(public pourable: PourableDesign, public appInfo: AppInfoService) {
    super();
    this.objectId = JsUtil.getObjectId();
    // console.log('ctor.BrandBlobButton', this.objectId);
    const uniqueId = pourable.id;
    const logoAsset = pourable.design.assets.logoHome;
    const gradientAsset = pourable.design.assets.gradient;
    const strokeColor = JsUtil.toColorNumber(pourable.design.colors.strokeHome);

    // Bindings
    this.onTick = this.onTick.bind(this);

    // Properties
    this._radius = 10;
    this._internalScale = 1;
    this._pressedPhase = 0;
    this._rotationSpeed = Math.random() > 0.5 ? -0.004 : 0.004; // Degrees per frame

    // Instances
    this._container = new Sprite();
    this.addChild(this._container);

    this._gradient = new Sprite(Texture.fromImage(gradientAsset));
    this._gradient.anchor.set(0.5, 0.5);
    this._gradient.interactive = true;
    this._gradient.buttonMode = true;
    this._gradient.on('click', this.onClicked.bind(this));
    this._gradient.on('pointerdown', this.onPointerDown.bind(this));
    this._gradient.on('pointerup', this.onPointerUp.bind(this));
    this._gradient.on('pointerupoutside', this.onPointerUp.bind(this));
    this._container.addChild(this._gradient);

    const randomSeed = StringUtils.quickNumericHash(uniqueId);

    this._gradientMask = new BlobShape(BrandBlobButton.ASSUMED_RADIUS, 0xff000000, 0x00000000, 0, 0.2, undefined, undefined, undefined, randomSeed);
    this._container.addChild(this._gradientMask);
    this._gradient.mask = this._gradientMask;

    // this._bubbles = LegacyAnimatedSprite.fromJSON('assets/animations/menu/bubbles.json');
    this._bubbles = LegacyAnimatedSprite.Create(this.appInfo.ConfigurationData.bubbles);
    this._bubbles.play();
    this._bubbles.alpha = 10;
    this._container.addChild(this._bubbles);

    this._logo = new Sprite(Texture.fromImage(logoAsset));
    this._logo.scale.set(0.5, 0.5);
    this._logo.anchor.set(0.5, 0.5);
    this._container.addChild(this._logo);

    this._stroke = new BlobShape(BrandBlobButton.ASSUMED_RADIUS * 1.03 - 3, 0x00000000, (0xff000000 | strokeColor) >>> 0, 3, 0.2, undefined, undefined, undefined, randomSeed + 1);
    this._container.addChild(this._stroke);

    // End
    this.redraw();

    // Start animation
    ticker.shared.add(this.onTick);
  }


  public get onTapped() {
    return this._onTapped;
  }

  public get radius() {
    return this._radius;
  }

  public set radius(radius: number) {
    if (this._radius !== radius) {
      this._radius = radius;
      this.redraw();
    }
  }

  public get internalScale() {
    return this._internalScale;
  }

  public set internalScale(internalScale: number) {
    if (this._internalScale !== internalScale) {
      this._internalScale = internalScale;
      this.redraw();
    }
  }

  public get pressedPhase() {
    return this._pressedPhase;
  }

  public set pressedPhase(pressedPhase: number) {
    if (this._pressedPhase !== pressedPhase) {
      this._pressedPhase = pressedPhase;
      this.redrawScale();
    }
  }

  public destroy() {
    // console.log('destroy.brandblob', this.objectId);
    ticker.shared.remove(this.onTick);
    this._onTapped.removeAll();
    this._logo.texture.destroy();
    this._logo.destroy();
    this._gradient.texture.destroy();
    this._gradient.destroy();
    this._gradientMask.destroy();
    this._bubbles.destroy();
    this._container.destroy();
    super.destroy();
  }


  private onTick(delta: number) {
    this._gradientMask.rotation += this._rotationSpeed * delta;
    this._stroke.rotation -= this._rotationSpeed * delta;

    const basicSpeed = this._radius + ticker.shared.lastTime / 2000 * this._radius / BrandBlobButton.ASSUMED_RADIUS;
    this._container.x = Math.cos(basicSpeed) * 3;
    this._container.y = Math.sin(basicSpeed * 0.9) * 3;
  }

  private onClicked() {
    this._onTapped.dispatch(this);
  }

  private onPointerDown() {
    Fween.use(this).to({pressedPhase: 1}, 0.2, Easing.quadOut).play();
  }

  private onPointerUp() {
    Fween.use(this).to({pressedPhase: 0}, 0.3, Easing.backOutWith(2)).play();
  }

  private redraw() {
    this.redrawScale();
  }

  private redrawScale() {
    const scale = this._radius / BrandBlobButton.ASSUMED_RADIUS * map(this._pressedPhase, 0, 1, 1, 0.9) * this._internalScale;
    if (!isNaN(scale)) this.scale.set(scale, scale);
  }
}
