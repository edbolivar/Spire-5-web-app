import Sprite = PIXI.Sprite;
import Box from '../../display/shapes/Box';
import AbstractScreen from '../../display/navigation/AbstractScreen';
import LiquidVideo from './LiquidVideo';
import BlobButton from '../../display/components/BlobButton';
import FlavorList from './FlavorList';
import BlobShape from '../../display/shapes/BlobShape';
import CalorieInfo from './CalorieInfo';
import LayoutUtils from '../../utils/LayoutUtils';
import StringUtils from '../../utils/StringUtils';
import AppRoutes from '../../display/navigation/AppRoutes';
import { AppInfoService } from '../../services/app-info.service';
import {
  FlavorDesign,
  PourableDesign,
  PourEventArgs,
  PourItem,
  IdleState,
  ConfigurationData
} from '../../universal/app.types';
import { JsUtil } from '../../universal/JsUtil';
import { LocalizationService } from '../../services/localization.service';
import {
  PublishEvent,
  PubSubTopic,
  SubscribeEvent
} from '../../universal/pub-sub-types';
import * as _ from 'lodash';
import FlavorMix from './FlavorMix';
import BrandBlobButton from '../home/BrandBlobButton';
import { Texture, BLEND_MODES } from 'pixi.js';
import Easing from '../../../transitions/Easing';
import { map } from 'moremath';
import { Point, Text } from 'pixi.js';
import { IdleTransition } from '../../display/navigation/IdleTransition';
import { SelectBrandTransition } from '../../display/navigation/SelectBrandTransition';
import { SharedGameLooper } from '../../utils/GameLooper';
import { MathUtils } from '../../utils/MathUtils';
import TextUtils from '../../utils/TextUtils';
import AnimatedSpriteController from '../../display/components/AnimatedSpriteController';
import { AnimationDefinitions } from '../../data/types/AnimationDefinition';
import RandomGenerator from '../../utils/RandomGenerator';

export default class BrandScreen extends AbstractScreen {

  static _instance: BrandScreen = null;
  private _beverage: PourableDesign;
  private _liquidVideo: LiquidVideo;
  private _pourButton: BlobButton;
  private _flavorList: FlavorList;
  private _liquidBackground: Sprite;
  private _bigBubbleMask: BlobShape;
  private _bigBubbleStroke: BlobShape;
  private _backButton: BlobButton;
  private _logo: Sprite;
  private _stroke: BlobShape;
  private _gradient: Sprite;
  private _gradientMask: BlobShape;
  private _animation: AnimatedSpriteController;
  private _hitArea: Box;

  private _calorieInfo: CalorieInfo;
  private _idleState: IdleState;
  private _dismissTimer;
  private _visibility: number = 0;
  objectId: number;

  private _flavorMix: FlavorMix;
  private _topPadding: number;
  private _labelTouch1: Text;
  private _labelTouch2: Text;
  private _buttonAda: BlobButton;
  private _isAda: boolean = false;

  constructor(pourable: PourableDesign, public appInfo: AppInfoService) {
    super(appInfo);
    this.objectId = JsUtil.getObjectId();
    this._beverage = pourable;

    this.update = this.update.bind(this);

    this.visible = false;
    BrandScreen._instance = this;

    this._topPadding = this._beverage.isMix ? 300 : 0;
    this._isAda = this.appInfo.isAda;
    console.log(`Brand Ada state: ${this._isAda}`);

    SubscribeEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
      .HandleEventWithThisMethod(e => this.onDataReady(e.data))
      .Done();

    this._labelTouch1 = new Text(
      'TOUCH HERE TO',
      TextUtils.getStyleBody(36, 0xff197af1)
    );

    this._labelTouch2 = new Text(
      'RETURN TO FULL SCREEN',
      TextUtils.getStyleBody(46, 0xff197af1)
    );

  }

  onDataReady(e: ConfigurationData) {
    this._idleState = e.idleState;
  }

  public async prepareToShow() {
    if (this.navigator.transition.type !== 'SelectBrand') {
      console.error('Unexpected transition at BrandScreen.prepare');
      return;
    }
    console.log(`prepare: ${this._isAda}`);
    const vw = this.Platform.width;
    const vh = this.Platform.height;

    this.appInfo.adaNavigationService.releaseButtons();


    if (!this._isAda) {
      this.createLiquidBackground(this._beverage, vw, vh);

      this.createLiquidVideo(this._beverage, vw, vh);

      this.createNutritionFacts(this._beverage, vw, vh);

      this.createBigBubble(this.navigator.transition as SelectBrandTransition);
      this.createLogo(this._beverage, vw, vh);
      this.createAnimation(this._beverage, vw, vh);

      if (this._beverage.isMix) {
        this.createFlavorsMix(this._beverage, vw, vh);
      } else {
        this.createFlavorsList(this._beverage, vw, vh);
      }
      this.createBackButton(this._beverage, vw, vh);
      this.createPourButton(this._beverage, vw, vh);

    } else {
      this.createNutritionFacts(this._beverage, vw, vh);
      this.createLogo(this._beverage, vw, vh);
      this.createNavLabel(vw, vh);
      if (this._beverage.isMix) {
        this.createFlavorsMix(this._beverage, vw, vh);
      } else {
        this.createFlavorsList(this._beverage, vw, vh);
        const preparelist = [this._flavorList.prepare(), this._calorieInfo.prepare()];
        await Promise.all(preparelist);
      }
      this.createPourButton(this._beverage, vw, vh);     
      this.createBackButton(this._beverage, vw, vh);
      this.createAdaButton(vw, vh);

    }
    
    if(this.appInfo.isAda === true) {
      SubscribeEvent.Create(PubSubTopic.notifyBrandButtonChangeSelected, this.objectId)
      .HandleEventWithThisMethod(e => {
        this.appInfo.adaNavigationService._Buttons.forEach(element => {
          element.isFocused = false;
        });
        this.appInfo.adaNavigationService._selectedButton.isFocused = true;
      })
      .Done();
    }
    // Initial settings
    this.alpha = 0;
    this.visible = true;

    this.interactive = true;
    this.on('pointermove', this.onPointerMove.bind(this));

    SharedGameLooper.onTickedOncePerVisualFrame.add(this.update);
    SharedGameLooper.updateOnce(this.update);

    if(!this._isAda)
    {
      var preparelist = this._beverage.isMix
      ? [
          this._liquidVideo.prepare(),
          this._flavorMix.prepare(),
          this._calorieInfo.prepare()
        ]
      : [
          this._liquidVideo.prepare(),
          this._flavorList.prepare(),
          this._calorieInfo.prepare()
        ];

      await Promise.all(preparelist);

      this._liquidVideo.play();
    } else if(this._isAda === true && this._beverage.isMix){
      const preparelist = [this._flavorMix.prepare(), this._calorieInfo.prepare()]
      await Promise.all(preparelist);
    }
  }

  public async prepareToHide() {
    this.interactive = false;
    this.removeAllListeners();

    this.stopWaitingForAttractor();
  }

  public async hide() {
    SharedGameLooper.onTickedOncePerVisualFrame.remove(this.update);
  }

  public async show() {
    this.waitAndShowAttractor();
  }

  public async transition(transitionInfluence: number) {
    this.visibility = transitionInfluence;
  }

  public set visibility(visibility: number) {
    if (this._visibility !== visibility) {
      this._visibility = visibility;
      this.redrawVisibility();
    }
  }

  public update(
    currentTimeSeconds: number,
    tickDeltaTimeSeconds: number,
    currentTick: number
  ) {
    const s = currentTimeSeconds;

    if (!this._isAda && this.navigator.transition.type === 'SelectBrand') {
      const rotationSpeed = (this.navigator.transition as SelectBrandTransition)
        .rotationSpeed;

      this._bigBubbleMask.rotation = MathUtils.rangeMod(
        (s * Math.PI * 2) / rotationSpeed,
        -Math.PI,
        Math.PI
      );
      this._bigBubbleStroke.rotation = MathUtils.rangeMod(
        (s * Math.PI * -2) / rotationSpeed,
        -Math.PI,
        Math.PI
      );
    }
  }

  public destroy() {
    this.stopWaitingForAttractor();
    if (!this._isAda) {
      this._bigBubbleMask.destroy();
      this._bigBubbleStroke.destroy();
      this._liquidVideo.destroy();
      this._backButton.destroy();
      this._pourButton.destroy();

      this._liquidBackground.destroy();
      this._calorieInfo.destroy();
      this._logo.destroy();

      if (this._beverage.isMix) {
        this._flavorMix.destroy();
      } else {
        this._flavorList.destroy();
      }
    } else {
      this._backButton.destroy();
      this._pourButton.destroy();

      this._calorieInfo.destroy();
      this._logo.destroy();
      this._buttonAda.destroy();
      this._labelTouch1.destroy();
      this._labelTouch2.destroy();
      this._hitArea.destroy();
      if (this._beverage.isMix) {
        this._flavorMix.destroy();
      } else {
        this._flavorList.destroy();f      }
    }
    BrandScreen._instance = null;
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
    super.destroy();
  }

  private redrawVisibility() {
    if (!this._isAda && this.navigator.transition.type === 'SelectBrand') {
      const selectBrandTransition = this.navigator
        .transition as SelectBrandTransition;

      const t = this._visibility;
      const uiVisibility = map(t, 0.5, 1, 0, 1, true);

      const qo: number = Easing.quintOut(t);
      const et: number = Easing.sineInOut(Easing.sineInOut(t));
      const uiPhase: number = map(this._visibility, 1, 0.7, 1, 0, true);

      this.alpha = qo;
      if (!this._isAda) {
        this._bigBubbleStroke.alpha = Easing.quadIn(uiVisibility);
      }

      if (this._flavorList != null) {
        this._flavorList.visibility = t;
      }

      if (this._flavorMix != null) {
        this._flavorMix.alpha = t;
      }

      if (this._animation != null) {
        this._animation.sprite.alpha = t;
      }

      const decreasePhase = 0.3;

      const relativeScale: number =
        selectBrandTransition.startRadius / selectBrandTransition.radius;

      const scale =
        t < decreasePhase
          ? map(
              Easing.quintOut(map(t, 0, decreasePhase, 0, 1)),
              0,
              1,
              relativeScale,
              relativeScale * 0.5
            )
          : map(
              Easing.quintInOut(map(t, decreasePhase, 1, 0, 1)),
              0,
              1,
              relativeScale * 0.5,
              1
            );

      this._bigBubbleMask.scale.set(scale, scale);
      this._bigBubbleStroke.scale.set(scale, scale);

      const p = new Point(
        selectBrandTransition.focusedPosition.x -
          selectBrandTransition.startPosition.x,
        selectBrandTransition.focusedPosition.y -
          selectBrandTransition.startPosition.y
      );

      this._bigBubbleMask.position = new Point(
        selectBrandTransition.startPosition.x + p.x * et,
        selectBrandTransition.startPosition.y + p.y * et
      );

      this._bigBubbleStroke.position = new Point(
        selectBrandTransition.startPosition.x + p.x * et,
        selectBrandTransition.startPosition.y + p.y * et
      );

      this._logo.alpha = Easing.quadOut(uiPhase);
    } else {
      const t = this._visibility;
      this.alpha = t;
    }
  }
  
  gotoHome() {
    this.navigator.goTo(AppRoutes.getHome());
  }
  gotoHomeOrigin() {
    this.appInfo.isAda = !this.appInfo.isAda;
    this.navigator.goTo(AppRoutes.getHome());
  }

  private onFlavorsChanged(selectedFlavorIds: string[]) {
    // Backend.get().setFlavors(selectedFlavorIds);
  }

  private onPointerMove() {
    if (this.visible) {
      this.waitAndShowAttractor();
    }
  }

  private createAdaButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = dimensions.width
      ? dimensions.width / 2
      : dimensions.height
        ? dimensions.height / 2
        : 0;
    this._buttonAda = new BlobButton(
      null,
      null,
      radius,
      0xff197af1,
      0xffffffff,
      'assets/ui/icon_ada.png',
      1,
      0xff197af1,
      false
    );
    this._buttonAda.x =
      radius + (dimensions.right || 0) + this._backButton.radius * 2;
    this._buttonAda.y = radius + (dimensions.top || 0);
    this._buttonAda.strokeFrontBackground = this._isAda
      ? 0xff197af1
      : 0xffffffff;
    this._buttonAda.iconColor = this._isAda ? 0xffffffff : 0xff197af1;

    this.addChild(this._buttonAda);
    this._buttonAda.onPressed.add(() => {
      this._isAda = !this._isAda;
      this.appInfo.isAda = this._isAda;
      this.navigator.goTo(AppRoutes.getHome());
    });
  }

  private createNavLabel(vw: number, vh: number) {

    this._labelTouch1.anchor.set(0.5, 0.5);
    this._labelTouch1.x = vw / 2;
    this._labelTouch1.y = vh / 5;
    this._labelTouch2.anchor.set(0.5, 0.5);
    this._labelTouch2.x = vw / 2;
    this._labelTouch2.y = vh / 5 + this._labelTouch1.height;
    this._labelTouch1.interactive = true;
    this._labelTouch2.interactive = true;
    this._labelTouch1.buttonMode = true;
    this._labelTouch1.buttonMode = true;
    this._labelTouch1.on('click', this.gotoHomeOrigin.bind(this));
    this._labelTouch2.on('click', this.gotoHomeOrigin.bind(this));

    this._hitArea = new Box(0xffff0000, vh, vw - vw / 3);
    this._hitArea.x = 0 ;
    this._hitArea.y = 0;
    this._hitArea.interactive = true;
    this._hitArea.buttonMode = true;
    this._hitArea.alpha = 0;
    this._hitArea.on('click', this.gotoHomeOrigin.bind(this));
    this.addChild(this._hitArea);
    this.addChild(this._labelTouch1);
    this.addChild(this._labelTouch2);
  }

  private createAnimation(beverage: PourableDesign, vw: number, vh: number) {
    const blendMode = BLEND_MODES.MULTIPLY;
    const x = vw + 0;
    
    const secondaryAnimations = [
      AnimationDefinitions.secondary_headphone,
      AnimationDefinitions.secondary_sweet
    ];
    
    // todo instead of choosing randomly, get the correct one
    // for the current beverage
    const selectedAnimationDefinition = RandomGenerator.getFromArray(secondaryAnimations)
    const y = 360;  // todo seems to be beverage-specific

    this._animation = new AnimatedSpriteController(selectedAnimationDefinition);
    this._animation.sprite.anchor.set(1, 0);
    this._animation.play();
    this._animation.sprite.blendMode = blendMode;
    this._animation.originalX = x;
    this._animation.originalY = y;
    this._animation.parent = this;
  }

  private createBigBubble(transition: SelectBrandTransition) {
    this._bigBubbleMask = new BlobShape(
      transition.radius,
      0xff000000,
      0x00000000,
      0,
      0.06,
      undefined,
      undefined,
      undefined,
      transition.randomSeed
    );
    this._bigBubbleMask.x = transition.focusedPosition.x;
    this._bigBubbleMask.y = transition.focusedPosition.y;
    this._bigBubbleMask.rotation = transition.startRotation;
    this.addChild(this._bigBubbleMask);

    this._bigBubbleStroke = new BlobShape(
      transition.radius,
      0x00000000,
      JsUtil.toColorNumber(transition.beverage.design.colors.strokeHome),
      5,
      0.06,
      undefined,
      undefined,
      undefined,
      transition.randomSeed + 1
    );
    
    this._bigBubbleStroke.x = transition.focusedPosition.x;
    this._bigBubbleStroke.y = transition.focusedPosition.y;
    this._bigBubbleMask.rotation = 0 - transition.startRotation;
    this.addChild(this._bigBubbleStroke);

    this._liquidBackground.mask = this._bigBubbleMask;
    this._liquidVideo.mask = this._bigBubbleMask;
  }

  private createLiquidBackground(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.Platform.layout.brandLiquidBackground;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._liquidBackground = Sprite.fromImage(
      beverage.design.assets.liquidBackground
    );
    this._liquidBackground.x = dimensions.left;
    this._liquidBackground.y = dimensions.top;
    this._liquidBackground.width = dimensions.width;
    this._liquidBackground.height = dimensions.height;
    this.addChild(this._liquidBackground);
  }

  private createLiquidVideo(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandLiquid;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._liquidVideo = new LiquidVideo([
      beverage.design.assets.liquidIntro,
      beverage.design.assets.liquidIdle
    ]);
    this._liquidVideo.x = dimensions.left;
    this._liquidVideo.y = dimensions.top;
    this._liquidVideo.width = dimensions.width;
    this._liquidVideo.height = dimensions.height;
    this.addChild(this._liquidVideo);
  }

  private createFlavorsList(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorList = new FlavorList(beverage.flavors, 3, this.appInfo);
    this._flavorList.x = dimensions.left;
    if (!this._isAda) {
      this._flavorList.y = dimensions.top + this._topPadding;
    } else {
      this._flavorList.y = dimensions.bottom + this._topPadding + vh / 2;
    }
    this._flavorList.onChanged.add(this.onFlavorsChanged.bind(this));
    this.addChild(this._flavorList);
  }

  private createFlavorsMix(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorMix = new FlavorMix(beverage, this.appInfo);
    this._flavorMix.x = dimensions.left;
    if (!this._isAda) {
      this._flavorMix.y = dimensions.top + this._topPadding;
    } else {
      this._flavorMix.y = dimensions.top - this._topPadding / 2 + vh / 2;
    }
    this.addChild(this._flavorMix);
  }

  private createBackButton(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandButtonBack;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const title = LocalizationService.LocalizeString('brand.back.title');
    const radius = dimensions.width / 2;

    this._backButton = new BlobButton(
      undefined,
      title,
      radius,
      0xff197af1,
      0xffffffff,
      'assets/ui/arrow-back.png',
      0.12,
      0xffffff,
      false
    );
    this._backButton.x = radius + dimensions.left;
    this._backButton.y = radius + dimensions.top;
    this._backButton.onTapped.add(() => {
      this.appInfo.isAda = this._isAda;
      this.navigator.goTo(AppRoutes.getHome(), null, this.navigator.transition);
    });
    this.addChild(this._backButton);
    if(this.appInfo.isAda === true){
      this.appInfo.adaNavigationService.appendButton(this._backButton);
    }

  }

  private createPourButton(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandButtonPour;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitle = LocalizationService.LocalizeString('brand.pour.preTitle');
    const title = LocalizationService.LocalizeString('brand.pour.title');
    const radius = dimensions.width / 2;

    this._pourButton = new BlobButton(
      preTitle,
      title,
      radius,
      JsUtil.toColorNumber(beverage.design.colors.strokeHome),
      0x11ffffff,
      'assets/ui/arrow-pour.png',
      0.32
    );

    this._pourButton.x = radius + dimensions.left;
    this._pourButton.y = radius + dimensions.top;
    this._pourButton.onPressed.add(this.startPour.bind(this));
    this._pourButton.onReleased.add(this.stopPour.bind(this));
    this.addChild(this._pourButton);
    if(this.appInfo.isAda === true) {
      this.appInfo.adaNavigationService.appendButton(this._pourButton);
    }
  }

  private createLogo(beverage: PourableDesign, vw: number, vh: number) {
    const uniqueId = beverage.id;
    const gradientAsset = beverage.design.assets.gradient;
    const strokeColor = JsUtil.toColorNumber(beverage.design.colors.strokeHome);

    const options = this.Platform.layout.brandLogo;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    // mask
    this._gradient = new Sprite(Texture.fromImage(gradientAsset));
    this._gradient.anchor.set(0.5, 0.5);
    this._gradient.x = dimensions.left + dimensions.width / 2;
    if (!this._isAda) {
      this._gradient.y =
        dimensions.top + dimensions.height / 2 + this._topPadding;
    } else if (this._isAda && this._beverage.isMix) {
      this._gradient.y =
        dimensions.top - dimensions.height / 2 + vh / 2 + this._topPadding / 2;
    } else {
      this._gradient.y =
        dimensions.top - dimensions.height / 2 + this._topPadding + vh / 2;
    }
    this.addChild(this._gradient);

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
    this._gradientMask.x = dimensions.left + dimensions.width / 2;
    if (!this._isAda) {
      this._gradientMask.y =
        dimensions.top + dimensions.height / 2 + this._topPadding;
    } else if (this._isAda && this._beverage.isMix) {
      this._gradientMask.y =
        dimensions.top - dimensions.height / 2 + vh / 2 + this._topPadding / 2;
    } else {
      this._gradientMask.y =
        dimensions.top - dimensions.height / 2 + this._topPadding + vh / 2;
    }
    this._gradient.mask = this._gradientMask;
    this.addChild(this._gradientMask);

    // Logo
    this._logo = Sprite.fromImage(
      this._beverage.isMix
        ? beverage.design.assets.logoBrand
        : beverage.design.assets.logoBrand
    );

    this._logo.anchor.set(0.5, 0.5);
    this._logo.scale.set(0.5, 0.5);
    this._logo.x = dimensions.left + dimensions.width / 2;
    if (!this._isAda) {
      this._logo.y = dimensions.top + dimensions.height / 2 + this._topPadding;
    } else if (this._isAda && this._beverage.isMix) {
      this._logo.y =
        dimensions.top - dimensions.height / 2 + vh / 2 + this._topPadding / 2;
    } else {
      this._logo.y =
        dimensions.top - dimensions.height / 2 + this._topPadding + vh / 2;
    }
    this.addChild(this._logo);

    // stroke
    this._stroke = new BlobShape(
      BrandBlobButton.ASSUMED_RADIUS * 1.03 - 3,
      0x00000000,
      (0xff000000 | strokeColor) >>> 0,
      3,
      0.2,
      undefined,
      undefined,
      undefined,
      randomSeed + 1
    );
    
    this._stroke.x = dimensions.left + dimensions.width / 2;
    if (!this._isAda) {
      this._stroke.y =
        dimensions.top + dimensions.height / 2 + this._topPadding;
    } else if (this._isAda && this._beverage.isMix) {
      this._stroke.y =
        dimensions.top - dimensions.height / 2 + vh / 2 + this._topPadding / 2;
    } else {
      this._stroke.y =
        dimensions.top - dimensions.height / 2 + this._topPadding + vh / 2;
    }
    this.addChild(this._stroke);
  }

  private createNutritionFacts(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.Platform.layout.container;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._calorieInfo = new CalorieInfo(beverage, dimensions);
    this.addChild(this._calorieInfo);
  }

  private startPour() {
    if (!this._beverage.isMix) {
      const flavors: PourItem[] = [];
      _.forEach(this._flavorList.selectedFlavors, function(
        flavorDesign: FlavorDesign
      ) {
        flavors.push(flavorDesign.pourItem);
      });

      const pourArgs = new PourEventArgs(
        this._beverage.pourItem,
        flavors,
        this.objectId
      );
      console.log('sending start pour', pourArgs);

      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
        .SetDataArgumentTo(pourArgs)
        .Send();
      if (!this._isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    } else {
      const flavors: PourItem[] = [];
      let bever:PourableDesign;

      const self = this;
      _.forEach(this.appInfo.ConfigurationData.pourables.flavors, function(
        flavorDesign: FlavorDesign
      ) {
        
        for(var i = 0; i < self._beverage.pourItem.flavorIds.length; i++) {
          if(flavorDesign.id === self._beverage.pourItem.flavorIds[i]) {
            flavors.push(flavorDesign.pourItem);
         } 
        }
      });

      _.forEach(this.appInfo.ConfigurationData.pourables.brands, function(
        brand: PourableDesign
      ) {
          if(brand.id === self._beverage.pourItem.brandId) {
            bever = brand;
        }
      });
      const pourArgs = new PourEventArgs(
        bever.pourItem,
        flavors,
        this.objectId
      );

      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
      .Send()
      .SetDataArgumentTo(pourArgs);

      if (!this._isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    }
  }

  private stopPour() {
    console.log('sending stop pour');
    PublishEvent.Create(PubSubTopic.stopPour, this.objectId).Send();
    if (!this._isAda) {
      this._liquidVideo.pouredTarget = 0;
    }
  }

  public waitAndShowAttractor() {
    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout(() => {
      this.showAttractor();
    }, this._idleState.delayBrand * 1000);
  }

  public stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
  }

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor(), null, new IdleTransition());
  }
}
