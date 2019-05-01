import { Sprite, ticker } from "pixi.js";
import BlobShape from "../shapes/BlobShape";
import SimpleSignal from "simplesignal";
import Easing from "../../../transitions/Easing";
import Fween from "../../../transitions/fween/Fween";
import { map } from "moremath";
import { JsUtil } from "../../universal/JsUtil";
import { SubscribeEvent } from "../../universal/pub-sub-types";
import { LocalizationService } from "../../services/localization.service";

export type CustomContentBlobButtonArgs = (
  instance: CustomContentBlobButton
) => void;

export default class CustomContentBlobButton extends Sprite {
  public _strokeAdaBack: BlobShape;
  public _strokeBack: BlobShape;
  public _strokeFront: BlobShape;

  private _adaStrokeBorder: BlobShape;
  private _adaStrokeFill: BlobShape;
  private _container: Sprite;
  private _isFocused: boolean = false;
  private _onPressed = new SimpleSignal<CustomContentBlobButtonArgs>();
  private _onReleased = new SimpleSignal<CustomContentBlobButtonArgs>();
  private _onTapped = new SimpleSignal<CustomContentBlobButtonArgs>();
  private _pressedPhase: number;
  private _radius: number;
  private _rotationSpeed: number;
  private _visibility: number;
  private objectId: number;

  constructor(
    radius: number,
    accentColor: number,
    backgroundColor: number,
    content: Sprite
  ) {
    super();
    this.objectId = JsUtil.getObjectId();

    // Bindings
    this.onTick = this.onTick.bind(this);

    this._radius = radius;
    this._pressedPhase = 0;
    this._rotationSpeed = Math.random() > 0.5 ? -0.004 : 0.004; // Degrees per frame

    // Instances
    this._container = new Sprite();
    this.addChild(this._container);

    this._strokeAdaBack = new BlobShape(
      this._radius + 10,
      0x00000000,
      0xaaaaaaaa,
      1.2,
      0.17
    );
    this._strokeAdaBack.visible = false;
    this._container.addChild(this._strokeAdaBack);

    this._strokeBack = new BlobShape(
      this._radius,
      0x00000000,
      0xaaaaaaaa,
      1.2,
      0.17
    );
    this._container.addChild(this._strokeBack);

    this._strokeFront = new BlobShape(
      this._radius,
      backgroundColor,
      accentColor,
      1.2,
      0.17
    );
    this._container.addChild(this._strokeFront);

    this._container.addChild(content);

    this.interactive = true;
    this.buttonMode = true;
    this.on("click", this.onClicked.bind(this));
    this.on("pointerdown", this.onPointerDown.bind(this));
    this.on("pointerup", this.onPointerUp.bind(this));
    this.on("pointerupoutside", this.onPointerUp.bind(this));
    this.on("pointerout", this.onPointerUp.bind(this));

    this.addSelectionBorder();

    // End
    this.redraw();

    // Start animation
    ticker.shared.add(this.onTick);
  }

  get isFocused() {
    return this._isFocused;
  }

  set isFocused(value: boolean) {
    this._isFocused = value;
    this._adaStrokeBorder.visible = value;
    this._adaStrokeFill.visible = value;
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
    this.removeAllListeners();

    if (this._strokeBack) {
      this._strokeBack.destroy();
      delete this._strokeBack;
    }

    if (this._container) {
      this._container.destroy();
      delete this._container;
    }

    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(
      this.objectId
    );
    super.destroy();
  }

  private onTick(delta: number) {
    this._strokeBack.rotation += this._rotationSpeed * delta;
    this._strokeFront.rotation -= this._rotationSpeed * delta;
    this._strokeAdaBack.rotation -= this._rotationSpeed * delta;
  }

  public onClicked() {
    this._onTapped.dispatch(this);
  }

  public onPointerDown() {
    this._onPressed.dispatch(this);
    Fween.use(this)
      .to({ pressedPhase: 1 }, 0.2, Easing.quadOut)
      .play();
  }

  public onPointerUp() {
    this._onReleased.dispatch(this);
    Fween.use(this)
      .to({ pressedPhase: 0 }, 0.3, Easing.backOutWith(2))
      .play();
  }

  public redraw() {
    this.redrawScale();
  }

  public get visibility(): number {
    return this._visibility;
  }
  public set visibility(__value: number) {
    if (this._visibility !== __value) {
      this._visibility = __value;
      this.redrawVisibility();
    }
  }

  private redrawVisibility() {
    this.visible = this._visibility > 0;

    const dt: number = 0.15;

    const scale = map(
      Math.max(0, Easing.backOut(this._visibility * (1 + dt) - dt)),
      0,
      1,
      0,
      1
    );

    this.scale.set(scale, scale);
  }

  private addSelectionBorder() {
    this._adaStrokeBorder = new BlobShape(
      this._radius - 5,
      0x00000000,
      0xff000000,
      12,
      0
    );
    this._adaStrokeBorder.visible = false;
    this._container.addChild(this._adaStrokeBorder);

    const adaColor = JsUtil.toColorNumber("#39c9bb");

    this._adaStrokeFill = new BlobShape(
      this._radius - 8.1,
      0x00000000,
      (0xff000000 | adaColor) >>> 0,
      6,
      0
    );
    this._adaStrokeFill.visible = false;
    this._container.addChild(this._adaStrokeFill);
  }

  private redrawScale() {
    const scale = map(this._pressedPhase, 0, 1, 1, 0.9);
    this.scale.set(scale, scale);

    const blobScale = map(this._pressedPhase, 0, 1, 1, 1.05);
    this._strokeBack.scale.set(blobScale, blobScale);
    this._strokeFront.scale.set(blobScale, blobScale);
    this._strokeAdaBack.scale.set(blobScale, blobScale);
  }
}
