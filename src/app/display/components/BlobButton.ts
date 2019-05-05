import {Sprite, Text, Texture, ticker} from 'pixi.js';
import BlobShape from '../shapes/BlobShape';
import SimpleSignal from 'simplesignal';
import TextUtils from '../../utils/TextUtils';
import Easing from '../../../transitions/Easing';
import Fween from '../../../transitions/fween/Fween';
import {map} from 'moremath';
import { JsUtil } from '../../universal/JsUtil';
import { SubscribeEvent } from '../../universal/pub-sub-types';
import {LocalizationService} from '../../services/localization.service';

export default class BlobButton extends Sprite {

  private _radius: number;
  private _rotationSpeed: number;
  private _container: Sprite;
  private _strokeFront: BlobShape;
  private _strokeBack: BlobShape;
  private _preTitle: Text;
  private _title: Text;
  private _icon: Sprite;
  private _moveIconOnPress: boolean;
  private _pressedPhase: number;
  private _onPressed = new SimpleSignal<(instance: BlobButton) => void>();
  private _onReleased = new SimpleSignal<(instance: BlobButton) => void>();
  private _onTapped = new SimpleSignal<(instance: BlobButton) => void>();
  private objectId: number;

  private _adaStrokeBorder: BlobShape;
  private _adaStrokeFill: BlobShape;

  private _isFocused: boolean = false;

  constructor(preTitleResourceId: string | undefined, titleResourceId: string | undefined, radius: number, accentColor: number, backgroundColor: number, iconAsset?: string, iconScale: number = 1, iconColor: number = 0xffffff, moveIcon: boolean = true) {
    super();
    this.objectId = JsUtil.getObjectId();

    // Bindings
    this.onTick = this.onTick.bind(this);

    // Properties 
    this._radius = radius;
    this._moveIconOnPress = moveIcon;
    this._pressedPhase = 0;
    this._rotationSpeed = Math.random() > 0.5 ? -0.004 : 0.004; // Degrees per frame

    // Instances
    this._container = new Sprite();
    this.addChild(this._container);

    this._strokeBack = new BlobShape(this._radius, 0x00000000, 0xaaaaaaaa, 1.2, 0.17);
    this._container.addChild(this._strokeBack);

    this._strokeFront = new BlobShape(this._radius * 0.99, backgroundColor, accentColor, 2.4, 0.18);
    this._container.addChild(this._strokeFront);

    this.interactive = true;
    this.buttonMode = true;
    this.on('click', this.onClicked.bind(this));
    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointerup', this.onPointerUp.bind(this));
    this.on('pointerupoutside', this.onPointerUp.bind(this));

    if (preTitleResourceId) {
      this._preTitle = new Text(LocalizationService.LocalizeString(preTitleResourceId), TextUtils.getStyleBody(this._radius * 0.2, 0xaaaaaa));
      this._preTitle.anchor.set(0.5, 0.5);
      this._preTitle.y = -this._radius * 0.3;
      this._container.addChild(this._preTitle);

      LocalizationService.instance.registerPixiTextObject(preTitleResourceId, this._preTitle, this.objectId);
    }

    if (titleResourceId) {
      this._title = new Text(LocalizationService.LocalizeString(titleResourceId), TextUtils.getStyleBody(this._radius * 0.25, accentColor));
      this._title.anchor.set(0.5, 0.5);
      this._container.addChild(this._title);

      LocalizationService.instance.registerPixiTextObject(titleResourceId, this._title, this.objectId);
    }

    if (iconAsset) {
      const iconTexture = Texture.fromImage(iconAsset);
      this._icon = new Sprite(iconTexture);
      this._icon.anchor.set(0.5, 0.5);
      this._icon.tint = (iconColor >>> 0) & 0xffffff;
      this._icon.scale.set(iconScale, iconScale);
      this._icon.y = (!titleResourceId && !preTitleResourceId) ? -this.radius * 0.3 : this._icon.y;
      this._container.addChild(this._icon);
    }

    this.addSelectionBorder();

    // End
    this.redraw();

    // Start animation
    ticker.shared.add(this.onTick);
  }

  public setTitles(preTitle: string | undefined, title: string | undefined) {
    if (preTitle && this._preTitle) {
      this._preTitle.text = preTitle;
    }

    if (title && this._title) {
      this._title.text = title;
    }
  }

  get isFocused() {
    return this._isFocused;
  }

  set isFocused(value: boolean) {
    this._isFocused = value ;
    this._adaStrokeBorder.visible = value ;
    this._adaStrokeFill.visible = value ;
  }

  public get onTapped() {
    return this._onTapped;
  }

  public get onPressed() {
    return this._onPressed;
  }

  public get onReleased() {
    return this._onReleased;
  }

  public get strokeFrontBackground() {
    return this._strokeFront.backgroundColor;
  }

  public set strokeFrontBackground(backgroundColor: number) {
    this._strokeFront.backgroundColor = backgroundColor;
  }

  public get iconColor() {
    return this._icon.tint;
  }

  public set iconColor(color: number) {
    this._icon.tint = (color >>> 0) & 0xffffff;
  }

  public get radius() {
    return this._radius;
  }

  public set radius(radius: number) {
    this._radius = radius;
    this.redraw();
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
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
    ticker.shared.remove(this.onTick);
    this._onTapped.removeAll();
    this._onPressed.removeAll();
    this._onReleased.removeAll();
    if (this._preTitle) { this._preTitle.destroy(); }
    if (this._title) { this._title.destroy(); }
    this._strokeBack.destroy();
    this._container.destroy();
    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(this.objectId);
    super.destroy();
  }

  private onTick(delta: number) {
    this._strokeBack.rotation += this._rotationSpeed * delta;
    this._strokeFront.rotation -= this._rotationSpeed * delta;
  }

  public onClicked() {
    this._onTapped.dispatch(this);
  }

  public onPointerDown() {
    this._onPressed.dispatch(this);
    Fween.use(this).to({pressedPhase: 1}, 0.2, Easing.quadOut).play();
  }

  public onPointerUp() {
    this._onReleased.dispatch(this);
    Fween.use(this).to({pressedPhase: 0}, 0.3, Easing.backOutWith(2)).play();
  }

  private redraw() {
    this.redrawScale();
  }

  private addSelectionBorder() {
    this._adaStrokeBorder = new BlobShape(
        this._radius - 25,
        0x00000000,
        0xff000000,
        12,
        0
      );
      this._adaStrokeBorder.visible = false ;
      this._container.addChild(this._adaStrokeBorder);
      
      const adaColor = JsUtil.toColorNumber('#39c9bb');

      this._adaStrokeFill = new BlobShape(
        this._radius - 28.1,
        0x00000000,
        (0xff000000 | adaColor) >>> 0,
        6,
        0
      );
      this._adaStrokeFill.visible = false ;
      this._container.addChild(this._adaStrokeFill);
  }
  private redrawScale() {
    const scale = map(this._pressedPhase, 0, 1, 1, 0.9);
    this.scale.set(scale, scale);

    const blobScale = map(this._pressedPhase, 0, 1, 1, 1.05);
    this._strokeBack.scale.set(blobScale, blobScale);
    this._strokeFront.scale.set(blobScale, blobScale);

    if (this._icon) {
      if (this._moveIconOnPress) {
        this._icon.y = this._radius * map(this._pressedPhase * this._pressedPhase, 0, 1, 0.4, 0.5);
      } else {
        this._icon.y = (this._title && this._preTitle) ? this._radius * 0.4 : 0.0;
      }
    }
  }
}
