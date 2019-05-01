import { Sprite, PointLike, Point, Rectangle } from 'pixi.js';
import Box from '../../display/shapes/Box';
import BrandBlobButton from './BrandBlobButton';
import ParticleLayer from './ParticleLayer';
import SimpleSignal from 'simplesignal';
import Easing from '../../../transitions/Easing';
import { map } from 'moremath';
import { AppInfoService } from '../../services/app-info.service';
import {
  PlatformModel,
  PourableDesign,
  DesignParticleParentItem,
  DesignOpacity
} from '../../universal/app.types';
import { polar } from '../../utils/PointUtils';
import { Transition } from '../../display/navigation/Transition';
import { SelectBrandTransition } from '../../display/navigation/SelectBrandTransition';
import { BrandSelectedArgs } from './BrandSelectedArgs';
import SequenceLayer from './SequenceLayer';
import { SharedGameLooper } from '../../utils/GameLooper';
import { SubscribeEvent, PubSubTopic } from '../../universal/pub-sub-types';
import BrandScreen from '../brand/BrandScreen';
import { IdleTransition } from '../../display/navigation/IdleTransition';
import { IdleToHomeTransition } from '../../display/navigation/IdleToHomeTransition';


export default class MainMenu extends Sprite {
  public static LAYER_ID_UNDER_EVERYTHING: number = 0;
  public static LAYER_ID_GRADIENT: number = 1;
  public static LAYER_ID_STROKE: number = 2;
  public static LAYER_ID_BUBBLES: number = 3;
  public static LAYER_ID_LOGO: number = 4;
  public static LAYER_ID_MESSAGE_TITLE: number = 5;
  public static LAYER_ID_MESSAGE_SUBTITLE: number = 6;
  public static LAYER_ID_FOCUS: number = 7;
  static LAYERS_TOTAL: number = 8;
  static LAYERS_TOUCHABLE: number[] = [
    MainMenu.LAYER_ID_UNDER_EVERYTHING,
    MainMenu.LAYER_ID_BUBBLES
  ];

  static _instance: MainMenu = null;
  private _objectId: number;

  private _visibility: number;
  private _transition: Transition;
  private _focusedPosition: Point;
  private _focusedRadius: number;


  private _intrinsicWidth: number;
  private _intrinsicHeight: number;

  private _hitArea: Box;
  private _buttons: BrandBlobButton[];

  private _onTappedBrand = new SimpleSignal<
    (brandSelectedArgs: BrandSelectedArgs) => void
  >();

  private _appInfo: AppInfoService;
  private _platform: PlatformModel;

  private _blobLayers: Sprite[] = [];

  private _particleLayer: ParticleLayer;
  private _sequenceLayer: SequenceLayer;
  private _isAda: boolean = false;

  constructor(__appInfo: AppInfoService) {
    super();

    this._appInfo = __appInfo;
    this._platform = this._appInfo.ConfigurationData.platform;

    this.update = this.update.bind(this);
    this.onAdded = this.onAdded.bind(this);

    this.on('added', this.onAdded);

    // Properties
    this._visibility = 1;
    this._intrinsicWidth = 100;
    this._intrinsicHeight = 100;

    this.createBlobLayers();

    // Instances
    this._hitArea = new Box(0xffff00);
    this._hitArea.alpha = 0;
    this.addChild(this._hitArea);

    this._buttons = [];
    const thingsThatPour: PourableDesign[] = this._appInfo.ConfigurationData.pourables.pourMenu;

    const floatingRadius: number = map(
      thingsThatPour.length,
      8,
      12,
      3,
      1,
      true
    );

    const floatingScaleOffset: number = map(
      thingsThatPour.length,
      8,
      12,
      0.01,
      0.005,
      true
    );

    thingsThatPour.forEach((beverage: PourableDesign) => {
      const defaultNodeInfo = {
        position: new Point(50, 50),
        scale: 1
      };

      const brandButton = new BrandBlobButton(
        beverage,
        defaultNodeInfo,
        this._appInfo,
        this._blobLayers,
        floatingRadius,
        floatingScaleOffset
      );

      brandButton.isUnderEverything = false;
      brandButton.onTapped.add(() => {
        this._onTappedBrand.dispatch({
          beverage,
          rotationSpeed: brandButton.rotationSpeed,
          startRotation: brandButton.currentRotation,
          startPosition: this.toGlobal(brandButton.nodeInfo.position),
          startRadius: brandButton.actualRadius
        } as BrandSelectedArgs);
      });
      this._buttons.push(brandButton);
    });

    this._appInfo.adaNavigationService.setButtons(this._buttons);

    this.createParticleLayer();

    SharedGameLooper.onTickedOncePerVisualFrame.add(this.update);
    SharedGameLooper.updateOnce(this.update);
    MainMenu._instance = this;

    SubscribeEvent.Create(PubSubTopic.notifyBrandButtonChangeSelected, this._objectId)
    .HandleEventWithThisMethod(e => {
      this.redraw(this._appInfo.isAda);
    })
    .Done();

    this.redraw(this._appInfo.isAda);
  }

  dispatchSelectedBrand() {
    if (this._appInfo.isAda) {
      const index = this._appInfo.adaNavigationService._Buttons.indexOf(this._appInfo.adaNavigationService._selectedButton);
      const beverage = this._appInfo.ConfigurationData.pourables.pourMenu[index];

      this._onTappedBrand.dispatch({
        beverage,
        rotationSpeed: this._buttons[index].rotationSpeed,
        startRotation: this._buttons[index].currentRotation,
        startPosition: this.toGlobal(this._buttons[index].nodeInfo.position),
        startRadius: this._buttons[index].actualRadius
      } as BrandSelectedArgs);
    }
  }

  public start() {
    if (this._sequenceLayer != null) {
      this._sequenceLayer.start();
    }
  }

  public stop() {
    if (this._sequenceLayer != null) {
      this._sequenceLayer.stop();
    }
  }

  private update(
    currentTimeSeconds: number,
    tickDeltaTimeSeconds: number,
    currentTick: number
  ) {
    if (this._sequenceLayer != null) {
      this._sequenceLayer.update(
        currentTimeSeconds,
        tickDeltaTimeSeconds,
        currentTick
      );
    }

    if (this._particleLayer != null) {
      this._particleLayer.update(
        currentTimeSeconds,
        tickDeltaTimeSeconds,
        currentTick
      );
    }

    this._buttons.forEach(button => {
      button.update(currentTimeSeconds, tickDeltaTimeSeconds, currentTick);
    });
  }

  private createBlobLayers() {
    this._blobLayers = [];
    for (let i = 0; i < MainMenu.LAYERS_TOTAL; i++) {
      this._blobLayers[i] = new Sprite();
      this._blobLayers[i].interactive =
        MainMenu.LAYERS_TOUCHABLE.indexOf(i) > -1;
      this.addChild(this._blobLayers[i]);
    }
  }

  private createParticleLayer() {
    const homeMenuConfig = this._platform.homeMenu;
    let particleParentItems = homeMenuConfig.items as DesignParticleParentItem[];
    if (particleParentItems.length !== this._buttons.length) {
      particleParentItems = particleParentItems.slice(0, this._buttons.length);
    }

    for (let i = 0; i < particleParentItems.length; i++) {

      const design = this._buttons[i].pourable.design.particlesHome;

      particleParentItems[i].colors = design.colors;
      particleParentItems[i].designOpacity = new DesignOpacity();
      particleParentItems[i].designOpacity.from = design.opacity.from;
      particleParentItems[i].designOpacity.to = design.opacity.to;
      particleParentItems[i].particleCount = 4;
    }
    this._particleLayer = new ParticleLayer(particleParentItems);
    this._blobLayers[MainMenu.LAYER_ID_UNDER_EVERYTHING].addChild(this._particleLayer);
  }

  private createSequenceLayer() {
    if (this._sequenceLayer) {
      return;
    }

    const marginX = 60;
    const marginY = 200;
    const desiredWidth = 1080 - (marginX * 2); // todo get values from system
    const desiredHeight = 1920 - (marginY * 2); // todo get values from system

    const animationArea = new Rectangle(
      (0 - this.position.x + marginX) / this.scale.x,
      (0 - this.position.y + marginY) / this.scale.y,
      desiredWidth / this.scale.x,
      desiredHeight / this.scale.y
    );

    this._sequenceLayer = new SequenceLayer(
      this._buttons,
      1 / this.scale.x,
      animationArea
    );

    this.addChild(this._sequenceLayer);
  }

  private onAdded() {
    this.createSequenceLayer();
  }

  public get onTappedBrand() {
    return this._onTappedBrand;
  }

  public get width() {
    return this.scale.x * this._intrinsicWidth;
  }

  public set width(width: number) {
    this.scale.x = width / this._intrinsicWidth;
  }

  public get height() {
    return this.scale.y * this._intrinsicHeight;
  }

  public set height(height: number) {
    this.scale.y = height / this._intrinsicHeight;
  }

  public get transition() {
    return this._transition;
  }

  public set transition(transition: Transition) {
    if (this._transition !== transition) {
      this._transition = transition;

      if (transition.type === 'SelectBrand') {
        const selectBrandTransition = transition as SelectBrandTransition;
        this._focusedPosition = selectBrandTransition.focusedPosition;
        this._focusedRadius = selectBrandTransition.radius;
      }

      this.redrawVisibility();
    }
  }

  public get visibility() {
    return this._visibility;
  }

  public set visibility(visibility: number) {
    if (this._visibility !== visibility) {
      this._visibility = visibility;
      this.redrawVisibility();
    }
  }

  public destroy() {
    if (BrandScreen._instance == null) {
      this._appInfo.adaNavigationService.releaseButtons();
    }

    this._buttons.forEach(button => {
      button.destroy();
    });
    this._buttons = [];

    if (this._hitArea) {
      this._hitArea.destroy();
      delete this._hitArea;
    }

    if (this._particleLayer) {
      this._particleLayer.destroy();
      delete this._particleLayer;
    }

    if (this._sequenceLayer != null) {
      this._sequenceLayer.destroy();
      delete this._sequenceLayer;
    }

    SharedGameLooper.onTickedOncePerVisualFrame.remove(this.update);
    SubscribeEvent.UnSubscribeByConsumer(this._objectId);
    MainMenu._instance = null;
    super.destroy();
  }

  public redraw(isAda: boolean) {
    this.isAda = isAda;

    const options = this._platform.homeMenu;
    const positions = this._appInfo.isAda
      ? (options.adaItems as DesignParticleParentItem[])
      : (options.items as DesignParticleParentItem[]);
    const numButtons = Math.min(this._buttons.length, options.items.length);
    positions.length = numButtons;

    // Find the offset of all object's rectangle
    const leftOffset = positions.reduce((prev, curr) => {
      return Math.min(curr.x - curr.radius, prev);
    }, 0);

    const topOffset = positions.reduce((prev, curr) => {
      return Math.min(curr.y - curr.radius, prev);
    }, 0);

    // Find the full area
    this._intrinsicWidth =
      positions.reduce((prev, curr) => {
        return Math.max(curr.x + curr.radius, prev);
      }, 0) - leftOffset;
    this._intrinsicHeight =
      positions.reduce((prev, curr) => {
        return Math.max(curr.y + curr.radius, prev);
      }, 0) - topOffset;

    this._buttons.forEach((button, index) => {
      if (index >= numButtons) {
        button.visible = false;
      } else {
        const px = positions[index].x - leftOffset;
        const py = positions[index].y - topOffset;

        button.visible = true;
        button.x = px;
        button.y = py;
        button.radius = positions[index].radius;

        button.nodeInfo = {
          position: new Point(px, py),
          scale: 1
        };

        button.redraw();
        button.isFocused = false;

        if (this._particleLayer) {
          this._particleLayer.setParticleContainerPosition(index, px, py);
        }
      }
    });

    this._appInfo.adaNavigationService._selectedButton.isFocused = this._appInfo.isAda ? true : false;
    this._hitArea.width = this._intrinsicWidth;
    this._hitArea.height = this._intrinsicHeight;
    this._appInfo.adaNavigationService.sortButtons();

    this.redrawVisibility();
  }

  public get isAda() {
    return this._isAda;
  }

  public set isAda(isAda: boolean) {
    if (this._isAda !== isAda) {
      this._isAda = isAda;

      if (isAda && this._sequenceLayer) {
        this._sequenceLayer.stop();
        this._sequenceLayer.destroy();
        delete this._sequenceLayer;
      }

      if (!isAda && !this._sequenceLayer) {
       this.createSequenceLayer();
        SharedGameLooper.updateOnce(this.update);
        this._sequenceLayer.start();
      }
    }
  }

  public get actualScale() {
    return (
      this.toGlobal({ x: 1, y: 0 } as PointLike).x -
      this.toGlobal({ x: 0, y: 0 } as PointLike).x
    );
  }

  private redrawVisibility() {
    if (this.transition == null) {
      return;
    }

    if (this.transition instanceof SelectBrandTransition) {
      this.redrawVisibilitySelectBrand(this.transition);
    } else if (
      this.transition instanceof IdleTransition ||
      this.transition instanceof IdleToHomeTransition
    ) {
      this.redrawVisibilityIdle();
    }
  }

  private redrawVisibilityIdle() {
    // Calculate position ranges so we can do an animation based on location, top to bottom
    let minY = NaN;
    let maxY = NaN;
    this._buttons.forEach((button) => {
      if (isNaN(minY) || button.y < minY) {
        minY = button.y;
      }

      if (isNaN(maxY) || button.y > maxY) {
        maxY = button.y;
      }
    });

    const numButtons = this._buttons.length;
    const animDuration = 0.5;

    for (let i = 0; i < numButtons; i++) {
      const button = this._buttons[i];
      const fy = map(button.y, minY, maxY);
      const f = fy;
      const animStart = f * (1 - animDuration);
      const displayPhase = map(this._visibility, animStart, animStart + animDuration, 0, 1, true);
      const alpha = displayPhase;
      const scale = map(Easing.quintOut(displayPhase), 0, 1, 0, 1);

      button.alpha = alpha;
      button.internalScale = scale;

      this._particleLayer.setParticleContainerScale(i, scale);
      this._particleLayer.setParticleContainerAlpha(i, alpha);
    }
  }

  private redrawVisibilitySelectBrand(transition: SelectBrandTransition) {
    // Animate all blobs
    const distance: number = 1800;
    let p: Point;
    const t: number = 1 - this._visibility;
    const t2: number = map(t, 0, 0.6, 0, 1, true);
    const qt: number = Easing.quadIn(t);
    const qt2: number = Easing.quadIn(t2);
    const qo: number = Easing.quintOut(t);
    const et: number = Easing.sineInOut(Easing.sineInOut(t));

    if (this._particleLayer != null) {
      this._particleLayer.alpha = map(t, 0, 0.3, 1, 0, true);
    }

    if (this._sequenceLayer != null) {
      this._sequenceLayer.alpha = map(t, 0, 0.3, 1, 0, true);
    }

    let focusedBlobSprites;
    if (transition.beverage) {
      const beverage = (this.transition as any).beverage as PourableDesign;

      focusedBlobSprites = this._buttons.find(
        button => button.pourable === beverage
      );
    }

    let showHideScale: number; // Scale because it's showing or hiding
    const treatFocusedBlobDifferently: boolean =
      focusedBlobSprites != null && this.visibility > 0;

    const showHideAnimTime: number = map(
      this._buttons.length,
      1,
      16,
      1,
      0.4,
      true
    ); // percentage of all transition time
    const showHideDelayPerItem: number =
      this._buttons.length > 1
        ? (1 - showHideAnimTime) / (this._buttons.length - 1)
        : 0;

    for (let i = this._buttons.length - 1; i >= 0; i--) {
      const button = this._buttons[i];

      if (this.visibility === 0) {
        showHideScale = 1;
      } else {
        showHideScale = Easing.quintInOut(
          this.visibility === 0
            ? 1
            : map(
                Easing.quadInOut(1 - this.visibility) -
                  showHideDelayPerItem * i,
                0,
                showHideAnimTime,
                1,
                0,
                true
              )
        );
      }

      if (!treatFocusedBlobDifferently || button !== focusedBlobSprites) {
        if (treatFocusedBlobDifferently) {
          // Distance the node from the focused point
          p = polar(
            distance,
            Math.atan2(
              button.nodeInfo.position.y -
                focusedBlobSprites.nodeInfo.position.y,
              button.nodeInfo.position.x -
                focusedBlobSprites.nodeInfo.position.x
            )
          );

          button.offsetX = p.x * qt;
          button.offsetY = p.y * qt;
        } else {
          // Use the same location
          button.offsetX = 0;
          button.offsetY = 0;
        }

        button.alpha = map(qt2, 0, 1, 1, 0) * showHideScale;
        button.scale.x = map(qt2, 0, 1, 1, 0) * showHideScale;
        button.scale.y = button.scale.y;
        button.logoAlpha = 1;
      }

      button.redraw();
    }

    const _brandTransitionIsHiding = true; // todo use real values

    if (treatFocusedBlobDifferently) {
      const focusedBeverageCenter = this.toLocal(this._focusedPosition);

      if (focusedBeverageCenter != null) {
        // Has focused bubble (liquid view)
        p = new Point(
          focusedBeverageCenter.x - focusedBlobSprites.nodeInfo.position.x,
          focusedBeverageCenter.y - focusedBlobSprites.nodeInfo.position.y
        );

        focusedBlobSprites.offsetX = p.x * et;
        focusedBlobSprites.offsetY = p.y * et;
      } else {
        // No focused bubble (no liquid view)
        focusedBlobSprites.offsetX = 0;
        focusedBlobSprites.offsetY = 0;
      }

      focusedBlobSprites.alpha = map(qo, 0, 1, 1, 0);
      focusedBlobSprites.logoAlpha = map(qo, 0, 1, 1, 0);

      const decreasePhase = 0.3;
      const desiredScale: number =
        this._focusedRadius / this.scale.x / focusedBlobSprites.radius;

      if (_brandTransitionIsHiding) {
        // Hiding (home to brand)
        const scale =
          t < decreasePhase
            ? map(Easing.quintOut(map(t, 0, decreasePhase, 0, 1)), 0, 1, 1, 0.5)
            : map(
                Easing.quintInOut(map(t, decreasePhase, 1, 0, 1)),
                0,
                1,
                0.5,
                desiredScale
              );

        focusedBlobSprites.internalScale = scale;
      }
    }
  }
}
