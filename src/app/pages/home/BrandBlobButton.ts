import { Sprite, Texture } from 'pixi.js';
import BlobShape from '../../display/shapes/BlobShape';
import StringUtils from '../../utils/StringUtils';
import AnimatedSpriteController from '../../display/components/AnimatedSpriteController';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import { map } from 'moremath';
import SimpleSignal from 'simplesignal';
import {PourableDesign} from '../../universal/app.types';
import {JsUtil} from '../../universal/JsUtil';
import OutOfStockOverlay from './OutOfStockOverlay';
import { AppInfoService } from '../../services/app-info.service';
import { NodeInfo } from '../../data/types/NodeInfo';
import { PointLike, Point } from 'pixi.js';
import MainMenu from './MainMenu';
import RandomGenerator from '../../utils/RandomGenerator';
import { polar } from '../../utils/PointUtils';
import { MathUtils } from '../../utils/MathUtils';
import { Color } from '../../data/types/Color';


export default class BrandBlobButton extends Sprite {
  public static readonly NODE_RADIUS_STANDARD: number = 80;
  public static readonly ASSUMED_RADIUS = 128;
  private static readonly IMPACT_FORCE: number = 10;						// Maximum force of impacts, in pixels
  private static readonly IMPACT_DECAY_TIME: number = 2;					// Time, in seconds, that it takes for an impact to decay
  private static readonly IMPACT_DECAY_CYCLES: number = 2;				// Cycles (2 waves) of impact motion

  objectId: number;
  private _scaleLogo: number;
  private _nodeInfo: NodeInfo;
  private _radius: number;
  private _internalScale: number;
  private _container: Sprite;
  private _logo: Sprite;
  private _stroke: BlobShape;
  private _adaStrokeBorder: BlobShape;
  private _adaStrokeFill: BlobShape;
  private _gradient: Sprite;
  private _gradientMask: BlobShape;
  private _bubbles: AnimatedSpriteController;
  private _outOfStockOverlay: OutOfStockOverlay;
  private _pressedPhase: number;
  private _onTapped = new SimpleSignal<(instance: BrandBlobButton) => void>();

  private _floatingRadius: number;
  private _floatingScaleOffset: number;

  private _currentTime: number;
  private _impactStartTime: number = 0;

  private _parentBlob: BrandBlobButton;							// "Parent" blob that is always on top of this
  private _isUnderEverything: boolean;								// Whether this blob is under everything (because it has a "parent")
  private _desiredParent: Sprite;
  private _blobLayers: Sprite[];

  private _isDisabled: boolean;
  private _brightnessDark: number;
  private _brightnessLight: number;

  // call redraw after modifying these
  private _offsetX: number = 0;
  private _offsetY: number = 0;
  private _offsetXFloat: number = 0;									// Offset due to floating
  private _offsetYFloat: number = 0;									// Offset due to floating
  private _offsetForceImpact: number = 0;								// Offset due to impact
  private _offsetAngleImpact: number = 0;								// Offset due to impact
  private _offsetXImpact: number = 0;									// Offset due to impact
  private _offsetYImpact: number = 0;									// Offset due to impact

  private _gradientImageSpeed: number;
  private _strokeImageSpeed: number;
  private _focusImageSpeed: number;

  constructor(
    public pourable: PourableDesign,
    nodeInfo: NodeInfo,
    public appInfo: AppInfoService,
    blobLayers: Sprite[],
    floatingRadius: number,
    floatingScaleOffset: number
  ) {
    super();
    this.objectId = JsUtil.getObjectId();
    this._nodeInfo = nodeInfo;

    const uniqueId = pourable.id;
    const logoAsset = pourable.design.assets.logoHome;
    const gradientAsset = pourable.design.assets.gradient;
    const strokeColor = JsUtil.toColorNumber(pourable.design.colors.strokeHome);
    this._brightnessDark = this.getBrightness(pourable.design.colors.animationDark);
    this._brightnessLight = this.getBrightness(pourable.design.colors.animationLight);
    this._scaleLogo = pourable.design.scaleLogo;

    this._isDisabled = pourable.pourItem.isDisabled;

    this._blobLayers = blobLayers;

    this._floatingRadius = floatingRadius;
    this._floatingScaleOffset = floatingScaleOffset;

    // Properties
    this._radius = 10;
    this._internalScale = 1;
    this._pressedPhase = 0;

    // Instances
    this._container = new Sprite();
    this.addChild(this._container);

    this._gradient = new Sprite(Texture.fromImage(gradientAsset));
    this._gradient.anchor.set(0.5, 0.5);
    this._gradient.interactive = !this.pourable.pourItem.isDisabled;
    this._gradient.buttonMode = true;
    this._gradient.on('click', this.onClicked.bind(this));
    this._gradient.on('pointerdown', this.onPointerDown.bind(this));
    this._gradient.on('pointerup', this.onPointerUp.bind(this));
    this._gradient.on('pointerupoutside', this.onPointerUp.bind(this));
    this._container.addChild(this._gradient);

    const direction: boolean = RandomGenerator.getBoolean();
    this._gradientImageSpeed = (direction ? 1 : -1) * RandomGenerator.getInRange(12, 18);
    this._strokeImageSpeed = (!direction ? 1 : -1) * RandomGenerator.getInRange(12, 18);
    this._focusImageSpeed = (!direction ? 1 : -1) * RandomGenerator.getInRange(12, 18);

    const randomSeed = StringUtils.quickNumericHash(uniqueId);

    this._gradientMask = new BlobShape(
      BrandBlobButton.ASSUMED_RADIUS,
      0xff000000,
      0x00000000,
      0,
      0.2,
      undefined,
      undefined,
      undefined,
      randomSeed
    );

    this._container.addChild(this._gradientMask);
    this._gradient.mask = this._gradientMask;

    this._bubbles = new AnimatedSpriteController(this.appInfo.ConfigurationData.bubbles);
    this._bubbles.play();
    this._bubbles.sprite.alpha = 1;
    this._bubbles.parent = this._container;

    this._stroke = new BlobShape(
      BrandBlobButton.ASSUMED_RADIUS * 1.03 - 3,
      0x00000000,
      (0xff000000 | strokeColor) >>> 0,
      1.5,
      0.2,
      undefined,
      undefined,
      undefined,  
      randomSeed + 1
    );
    this._container.addChild(this._stroke);

    const setLogoScale = () => {
      // edge length of a square that fits inside the blob circle
      const edgeLimit = Math.sqrt(Math.pow(BrandBlobButton.ASSUMED_RADIUS * 2, 2) / 2) * 0.7 * this._scaleLogo;
      const t = this._logo.texture;
      const maxEdge = Math.max(t.width, t.height);
      const scale = edgeLimit / maxEdge;
      this._logo.scale.set(scale, scale);
    };

    // ToDo: crashes if logo is not found, need a fallback approach
    const texture = Texture.fromImage(logoAsset);
    this._logo = new Sprite(texture);
    this._logo.anchor.set(0.5, 0.5);
    this._container.addChild(this._logo);
    this.logoAlpha = 1;

    if (texture.width > 1) {
      setLogoScale();
    } else {
      texture.on('update', setLogoScale);
    }

    if (this.pourable.pourItem.isDisabled) {
      this.addOutOfStockOverlay();
    } else {
      this.addSelectionBorder();
    }
    
    this.redraw();
  }

  public get nodeRadius(): number {
    return this.nodeInfo.scale * BrandBlobButton.NODE_RADIUS_STANDARD;
  }

  public get isUnderEverything(): boolean {
    return this._isUnderEverything;
  }

  public set isUnderEverything(value: boolean) {
    if (this._isUnderEverything !== value) {
      this._isUnderEverything = value;
      this.applyDesiredParent();
    }
  }

  public get parentBlob(): BrandBlobButton {
    return this._parentBlob;
  }

  public set parentBlob(value: BrandBlobButton) {
    if (this._parentBlob !== value) {
      this._parentBlob = value;
      this.applyDesiredParent();
    }
  }

  public get available(): number {
    return this.pourable.pourItem.isDisabled ? 0 : 1;
  }

  private getBrightness(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  public get nodeInfo() {
    return this._nodeInfo;
  }

  public set nodeInfo(nodeInfo: NodeInfo) {
    this._nodeInfo = nodeInfo;
  }

  public addChildrenToSprite(sprite?: Sprite): void {
    // Add all the children of this blob sprites info to a given sprite
    // If no parent sprite is passed, it is reset, adding the children to the default layers for speed
    this._desiredParent = sprite;
    this.applyDesiredParent();

    // Also move the parent blob to the top, if it has one
    if (this._parentBlob != null) {
      this._parentBlob.addChildrenToSprite(sprite);
    }
  }

  public get onTapped() {
    return this._onTapped;
  }

  public get rotationSpeed() {
    return this._gradientImageSpeed;
  }

  public get currentRotation() {
    return this._gradientMask.rotation;
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

  public get logoAlpha() {
    return this._logo.alpha;
  }

  public set logoAlpha(logoAlpha: number) {
    const a = this._isDisabled ? logoAlpha * 0.2 : logoAlpha;

    if (this._logo != null && this._logo.alpha !== a) {
      this._logo.alpha = a;
    }

    if (this._stroke != null && this._stroke.alpha !== a) {
      this._stroke.alpha = a;
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

  private addOutOfStockOverlay() {
    // ToDo: need to disable click, but good for now, so we can test
  
    this._outOfStockOverlay = new OutOfStockOverlay(
      Color.fromString('#99ffffff'),
      Color.fromString('#99000000')
    );
    this._container.addChild(this._outOfStockOverlay);
  }

  private addSelectionBorder() {
    const adaColor = JsUtil.toColorNumber('#6feedd');

    this._adaStrokeBorder = new BlobShape(
        BrandBlobButton.ASSUMED_RADIUS - 25,
        0x22ffffff,
        adaColor,
        12,
        0
      );

      this._adaStrokeBorder.visible = false ;
      this._container.addChild(this._adaStrokeBorder);


      this._adaStrokeFill = new BlobShape(
        BrandBlobButton.ASSUMED_RADIUS - 26.1,
        0x00000000,
        (0xff000000 | adaColor ) >>> 0,
        6,
        0
      );
      this._adaStrokeFill.visible = false ;
      this._container.addChild(this._adaStrokeFill);
  }

  public destroy() {
    if (this._adaStrokeBorder != null) {
      this._adaStrokeBorder.destroy();
      delete this._adaStrokeBorder;
    }

    if (this._adaStrokeFill != null) {
      this._adaStrokeFill.destroy();
      delete this._adaStrokeFill;
    }

    this._onTapped.removeAll();
    
    if (this._logo != null) {
      this._logo.destroy();
      delete this._logo;
    }

    this._gradient.texture.destroy();
    this._gradient.destroy();
    this._gradientMask.destroy();
    this._bubbles.destroy();
    
    if (this._outOfStockOverlay) {
      this._outOfStockOverlay.destroy();
      delete this._outOfStockOverlay;
    }

    this._container.destroy();
    super.destroy();
  }

  public get actualScale() {
    return (
      this.toGlobal({ x: 1, y: 0 } as PointLike).x -
      this.toGlobal({ x: 0, y: 0 } as PointLike).x
    );
  }

  public get actualRadius() {
    return BrandBlobButton.ASSUMED_RADIUS * this.actualScale;
  }

  public set actualRadius(radius: number) {
    this.internalScale =
      radius /
      BrandBlobButton.ASSUMED_RADIUS /
      (this.parent as any).actualScale;
  }

  public get offsetX(): number {
    return this._offsetX;
  }
  
  public set offsetX(__value: number) {
    if (this._offsetX !== __value) {
      this._offsetX = __value;
    }
  }

  public get offsetY(): number {
    return this._offsetY;
  }

  public set offsetY(__value: number) {
    if (this._offsetY !== __value) {
      this._offsetY = __value;
    }
  }

  public get offsetXFloat(): number {
    return this._offsetXFloat;
  }

  public get offsetYFloat(): number {
    return this._offsetYFloat;
  }

  public get offsetXImpact(): number {
    return this._offsetXImpact;
  }

  public get offsetYImpact(): number {
    return this._offsetYImpact;
  }

  public update(currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number) {
    const s: number = currentTimeSeconds;
    this._currentTime = currentTimeSeconds;

    this._offsetXFloat = Math.sin(s * this._gradientImageSpeed / 10) * this._floatingRadius;
    this._offsetYFloat = Math.cos(s * this._strokeImageSpeed / 10) * this._floatingRadius;

    if (this._impactStartTime > 0 && currentTimeSeconds < this._impactStartTime + BrandBlobButton.IMPACT_DECAY_TIME) {
      // Has an impact taking place
      const impactPhase: number = map(currentTimeSeconds, this._impactStartTime, this._impactStartTime + BrandBlobButton.IMPACT_DECAY_TIME, 0, 1, true);
      const impactPoint: Point = polar((1 - impactPhase) * this._offsetForceImpact * Math.sin(impactPhase * Math.PI * 2 * BrandBlobButton.IMPACT_DECAY_CYCLES), this._offsetAngleImpact);
      this._offsetXImpact = impactPoint.x;
      this._offsetYImpact = impactPoint.y;
    } else {
      // No impact
      this._offsetXImpact = 0;
      this._offsetYImpact = 0;
    }

    const tOffsetX: number = this._offsetXFloat + this._offsetX + this._offsetXImpact;
    const tOffsetY: number = this._offsetYFloat + this._offsetY + this._offsetYImpact;

    this.position.set(
      this._nodeInfo.position.x + tOffsetX,
      this._nodeInfo.position.y + tOffsetY
    );

    this._gradientMask.rotation = MathUtils.rangeMod(s * Math.PI * 2 / this._gradientImageSpeed, -Math.PI, Math.PI);
    this._stroke.rotation = MathUtils.rangeMod(s * Math.PI * 2 / this._strokeImageSpeed, -Math.PI, Math.PI);
  }

  private onClicked() {
    this._onTapped.dispatch(this);
  }

  private onPointerDown() {
    Fween.use(this)
      .to({ pressedPhase: 1 }, 0.2, Easing.quadOut)
      .play();
  }

  private onPointerUp() {
    Fween.use(this)
      .to({ pressedPhase: 0 }, 0.3, Easing.backOutWith(2))
      .play();
  }

  public setImpact(__angle: number, __impactScale: number = 1): void {
    // Moves the bubble slightly due to an impact, with some elastic damping
    this._impactStartTime = this._currentTime;
    this._offsetAngleImpact = __angle;
    this._offsetForceImpact = BrandBlobButton.IMPACT_FORCE * __impactScale;
  }

  public cancelImpact(): void {
    this._offsetForceImpact = 0;
    this._offsetAngleImpact = 0;
    this._offsetXImpact = 0;
    this._offsetYImpact = 0;
  }

  public redraw() {
    this.redrawScale();
  }

  private redrawScale() {
    const scale =
      (this._radius / BrandBlobButton.ASSUMED_RADIUS) *
      map(this._pressedPhase, 0, 1, 1, 0.9) *
      this._internalScale;
    this.scale.set(scale, scale);

    if (this._outOfStockOverlay != null) {
      const messageScale = map(this._radius, 40, 90, 1, 0.6, true);

      this._outOfStockOverlay.scale.set(messageScale, messageScale);
    } 
  }

  private applyDesiredParent(): void {
    if (Boolean(this._desiredParent)) {
      // Add to a specific parent
      this._desiredParent.addChild(this);

    } else {
      if (this._isUnderEverything) {
        // Actually renders under everything, for animations
        this._blobLayers[MainMenu.LAYER_ID_UNDER_EVERYTHING].addChild(this);
      } else {
      // Uses the main layers (save draws)
        this._blobLayers[MainMenu.LAYER_ID_GRADIENT].addChild(this);
      }
    }
  }

  get isFocused() {
    return this.pourable.pourItem.isFocused;  
  }

  set isFocused(value: boolean) {
    this.pourable.pourItem.isFocused = value;

    if (this._adaStrokeBorder != null) {
      this._adaStrokeBorder.visible = value;
    }

    if (this._adaStrokeFill != null) {
      this._adaStrokeFill.visible = value;
    }
  }
}
