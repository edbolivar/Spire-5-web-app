import { Sprite, Texture } from "pixi.js";
import Box from "../../display/shapes/Box";
import AbstractScreen from "../../display/navigation/AbstractScreen";
import LiquidVideo from "./LiquidVideo";
import BlobButton from "../../display/components/BlobButton";
import FlavorList from "./FlavorList";
import BlobShape from "../../display/shapes/BlobShape";
import CalorieInfo from "./CalorieInfo";
import LayoutUtils, { createImageToFit } from "../../utils/LayoutUtils";
import AppRoutes from "../../display/navigation/AppRoutes";
import { AppInfoService } from "../../services/app-info.service";
import {
  FlavorDesign,
  PourableDesign,
  PourEventArgs,
  PourItem,
  IdleState,
  ConfigurationData,
  DeviceInfo
} from "../../universal/app.types";
import { JsUtil } from "../../universal/JsUtil";
import { LocalizationService } from "../../services/localization.service";
import {
  PublishEvent,
  PubSubTopic,
  SubscribeEvent
} from "../../universal/pub-sub-types";
import * as _ from "lodash";
import FlavorMix from "./FlavorMix";
import { BLEND_MODES } from "pixi.js";
import Easing from "../../../transitions/Easing";
import { map } from "moremath";
import { Point, Text } from "pixi.js";
import { IdleTransition } from "../../display/navigation/IdleTransition";
import { SelectBrandTransition } from "../../display/navigation/SelectBrandTransition";
import { SharedGameLooper } from "../../utils/GameLooper";
import { MathUtils } from "../../utils/MathUtils";
import TextUtils from "../../utils/TextUtils";
import AnimatedSpriteController from "../../display/components/AnimatedSpriteController";
import { ParticleCreator } from "./particles/ParticleCreator";
import { ParticleCreatorFactoryCircle } from "./particles/ParticleCreatorFactoryCircle";
import HomeScreen from "../home/HomeScreen";
import CustomContentBlobButton from "../../display/components/CustomContentBlobButton";
import PourButtonContent from "./PourButtonContent";
import { ParticleCreatorFactoryLine } from "./particles/ParticleCreatorFactoryLine";

export default class BrandScreen extends AbstractScreen {
  static _instance: BrandScreen = null;

  public objectId: number;
  public _isPourClicked: boolean = false;

  private _animation: AnimatedSpriteController;
  private _backButton: BlobButton;
  private _beverage: PourableDesign;
  private _bigBubbleMask: BlobShape;
  private _bigBubbleStroke: BlobShape;
  private _buttonAda: BlobButton;  
  private _calorieInfo: CalorieInfo;
  private _dismissTimer;
  private _flavorList: FlavorList;
  private _flavorMix: FlavorMix;
  private _hitArea: Box;
  private _idleState: IdleState;
  private _labelTouch1: Text;
  private _labelTouch2: Text;
  private _layerBackground: Sprite;
  private _layerVideo: Sprite;
  private _layerControls: Sprite;
  private _liquidBackground: Sprite;
  private _liquidVideo: LiquidVideo;
  private _logo: Sprite;
  private _mastHead: LiquidVideo;
  private _particleCreator: ParticleCreator;
  private _pourButton: CustomContentBlobButton;
  private _topPadding: number;
  private _visibility: number = 0;

  constructor(beverage: PourableDesign, public appInfo: AppInfoService) {
    super(appInfo);

    this.gotoHomeOrigin = this.gotoHomeOrigin.bind(this);
    this.onFlavorsChanged = this.onFlavorsChanged.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.stopPour = this.stopPour.bind(this);
    this.startPour = this.startPour.bind(this);
    this.update = this.update.bind(this);

    this._layerBackground = new Sprite();
    this._layerVideo = new Sprite();
    this._layerControls = new Sprite();

    this.addChild(this._layerVideo);
    this.addChild(this._layerBackground);
    this.addChild(this._layerControls);

    this.objectId = JsUtil.getObjectId();
    this._beverage = beverage;
    this.visible = false;
    
    BrandScreen._instance = this;

    this._topPadding = this._beverage.isMix ? 300 : 0;

    SubscribeEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
      .HandleEventWithThisMethod(e => this.onDataReady(e.data))
      .Done();
  }

  public destroy() {
    this.stopWaitingForAttractor();

    if (this._animation) {
      this._animation.destroy();
      delete this._animation;
    }

    if (this._backButton) {
      this._backButton.destroy();
      delete this._backButton;
    }

    if (this._bigBubbleMask) {
      this._bigBubbleMask.destroy();
      delete this._bigBubbleMask;
    }

    if (this._bigBubbleStroke) {
      this._bigBubbleStroke.destroy();
      delete this._bigBubbleStroke;
    }

    if (this._buttonAda) {
      this._buttonAda.destroy();
      delete this._buttonAda;
    }

    if (this._calorieInfo) {
      this._calorieInfo.destroy();
      delete this._calorieInfo;
    }

    if (this._flavorList) {
      this._flavorList.destroy();
      delete this._flavorList;
    }

    if (this._flavorMix) {
      this._flavorMix.destroy();
      delete this._flavorMix;
    }

    if (this._hitArea) {
      this._hitArea.destroy();
      delete this._hitArea;
    }

    if (this._liquidBackground) {
      this._liquidBackground.destroy();
      delete this._liquidBackground;
    }

    if (this._liquidVideo) {
      this._liquidVideo.destroy();
      delete this._liquidVideo;
    }

    if (this._logo) {
      this._logo.destroy();
      delete this._logo;
    }

    if (this._mastHead) {
      this._mastHead.destroy();
      delete this._mastHead;
    }

    if (this._particleCreator) {
      this._particleCreator.dispose();
      delete this._particleCreator;
    }

    if (this._pourButton) {
      this._pourButton.destroy();
      delete this._pourButton;
    }

    if (this._labelTouch1) {
      this._labelTouch1.destroy();
      delete this._labelTouch1;
    }

    if (this._labelTouch2) {
      this._labelTouch2.destroy();
      delete this._labelTouch2;
    }

    if (this._layerBackground) {
      this._layerBackground.removeChildren();
      this._layerBackground.destroy();
      delete this._layerBackground;
    }

    if (this._layerVideo) {
      this._layerVideo.removeChildren();
      this._layerVideo.destroy();
      delete this._layerVideo;
    }

    if (this._layerControls) {
      this._layerControls.removeChildren();
      this._layerControls.destroy();
      delete this._layerControls;
    }

    BrandScreen._instance = null;

    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
    super.destroy();
  }

  public gotoHome() {
    this.navigator.goTo(AppRoutes.getHome());
  }

  public async hide() {
    SharedGameLooper.onTickedOncePerVisualFrame.remove(this.update);
  }

  public async prepareToHide() {
    this.interactive = false;
    this.removeAllListeners();

    this.stopWaitingForAttractor();
  }

  public async prepareToShow() {
    PublishEvent.Create(PubSubTopic.changeDx3Lighting, this.objectId)
      .SetDataArgumentTo(this._beverage.design.colorLight[0])
      .Send();

    if (this.navigator.transition.type !== "SelectBrand") {
      console.error("Unexpected transition at BrandScreen.prepare");
      return;
    }

    const vw = this.Platform.width;
    const vh = this.Platform.height;

    this.appInfo.adaNavigationService.releaseButtons();

    await this.createNutritionFacts(this._beverage, vw, vh);
    await this.createBackButton(this._beverage, vw, vh);
    await this.createLogo(this._beverage, vw, vh);
    await this.createMastHead(this._beverage, vw, vh);
    await this.createParticles(
      this.navigator.transition as SelectBrandTransition,
      vw,
      vh
    );
    await this.createPourButton(this._beverage, vw, vh);

    if (this._beverage.isMix) {
      await this.createFlavorsMix(this._beverage, vw, vh);
    } else {
      await this.createFlavorsList(this._beverage, vw, vh);
    }

    if (this.appInfo.isAda) {
      await this.createAdaButton(vw, vh);
      await this.createNavLabel(vw, vh);

      SubscribeEvent.Create(
        PubSubTopic.notifyBrandButtonChangeSelected,
        this.objectId
      )
        .HandleEventWithThisMethod(e => {
          this.appInfo.adaNavigationService._Buttons.forEach(element => {
            element.isFocused = false;
          });
          this.appInfo.adaNavigationService._selectedButton.isFocused = true;
        })
        .Done();
    } else {
      await this.createBigBubble(this._beverage, this.navigator.transition as SelectBrandTransition, vw, vh);
    }
    
    await this.createAnimation(this._beverage, vw, vh);

    // Initial settings
    this.alpha = 0;
    this.visible = true;
    this.interactive = true;
    this.on("pointermove", this.onPointerMove);

    SharedGameLooper.onTickedOncePerVisualFrame.add(this.update);
    SharedGameLooper.updateOnce(this.update);

    if (this._mastHead) {
      this._mastHead.play();
    }

    if (this._liquidVideo) {
      this._liquidVideo.play();
    }
    if (this._animation) {
//          this._animation.play();
    }
  }

  public async show() {
    this.waitAndShowAttractor();
  }

  public stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
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

    if (
      !this.appInfo.isAda &&
      this.navigator.transition != null &&
      this.navigator.transition.type === "SelectBrand"
    ) {
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

  public waitAndShowAttractor() {
    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout(() => {
      this.showAttractor();
    }, this._idleState.delayBrand * 1000);
  }

  private createAdaButton(vw: number, vh: number) {
    const options = this.Platform.layout.brandButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = (dimensions.width | dimensions.height | 0) / 2;

    const { adaIconScale } = this.Platform.blobButton;

    this._buttonAda = new BlobButton(
      null,
      null,
      radius,
      0xff3291e0,
      0xffffffff,
      "assets/ui/icon_ada.png",
      adaIconScale,
      0xff3291e0,
      false
    );

    this._buttonAda.x = radius + dimensions.left;
    this._buttonAda.y = radius + dimensions.top;
    this._buttonAda.strokeFrontBackground = this.appInfo.isAda ? 0xff3291e0 : 0xffffffff;
    this._buttonAda.iconColor = this.appInfo.isAda ? 0xffffffff : 0xff3291e0;

    this._layerControls.addChild(this._buttonAda);

    this._buttonAda.onPressed.add(() => {
      this.appInfo.isAda = !this.appInfo.isAda;
      this.navigator.goTo(AppRoutes.getHome());
    });
  }

  private createAnimation(beverage: PourableDesign, vw: number, vh: number) {
    const blendMode = BLEND_MODES.MULTIPLY;
    const x = vw + 0;
    const secondaryAnimation = this.appInfo.isAda
      ? beverage.design.secondaryAnimationAda
      : beverage.design.secondaryAnimation;

    if (secondaryAnimation == null) {
      return;
    }

    const animationDefinition = this.appInfo.ConfigurationData.animations.find(
      a => a.id === secondaryAnimation.animationId
    );

    if (!animationDefinition) {
      return;
    }

    const y = 550 + secondaryAnimation.offsetY;

    this._animation = new AnimatedSpriteController(animationDefinition);
    this._animation.sprite.anchor.set(1, 0);
    this._animation.sprite.blendMode = blendMode;
    this._animation.originalX = x;
    this._animation.originalY = y;
    this._animation.parent = this._layerBackground;
    console.log("2");

  }

  private async createBackButton(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.appInfo.isAda ? this.Platform.layout.brandButtonBackAda : this.Platform.layout.brandButtonBack;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const title = LocalizationService.LocalizeString("brand.back.title");

    const radius = dimensions.width / 2;
    if (DeviceInfo.unitState.UnitType === "Spire5") {
      this._backButton = new BlobButton(
        null,
        title,
        radius,
        0xff3291e0,
        0xffffffff,
        "assets/ui/arrow-back.png",
        0.12,
        0xffaaaaaa,
        true
      );
    } else {
      this._backButton = new BlobButton(
        null,
        title,
        radius,
        this.appInfo.isAda ? 0xff3291e0 : 0xffffffff,
        this.appInfo.isAda ? 0xffffffff : 0x55798989,
        "assets/ui/arrow-back.png",
        0.12,
        this.appInfo.isAda ? 0xffaaaaaa : 0x11ffffff,
        true
      );
    }

    this._backButton.x = radius + dimensions.left;
    this._backButton.y = radius + dimensions.top;
    this._backButton.onTapped.add(() => {
      this.appInfo.isAda = this.appInfo.isAda;
      this.navigator.goTo(AppRoutes.getHome(), null, this.navigator.transition);
    });

    this._layerControls.addChild(this._backButton);

    if (this.appInfo.isAda) {
      this.appInfo.adaNavigationService.appendButton(this._backButton);
    }
  }

  private async createBigBubble(beverage: PourableDesign, transition: SelectBrandTransition, vw: number, vh: number) {
    const liquidOptions = this.Platform.layout.brandLiquid;
    const liquidDimensions = LayoutUtils.parseLayoutRectangle(liquidOptions, vw, vh);

    const backgroundOptions = this.Platform.layout.brandLiquidBackground;
    const backgroundDimensions = LayoutUtils.parseLayoutRectangle(backgroundOptions, vw, vh);

    this._liquidBackground = Sprite.fromImage(
      beverage.design.assets.liquidBackground
    );

    this._liquidBackground.x = backgroundDimensions.left;
    this._liquidBackground.y = backgroundDimensions.top;
    this._liquidBackground.width = backgroundDimensions.width;
    this._liquidBackground.height = backgroundDimensions.height;
    this._layerVideo.addChild(this._liquidBackground);

    this._liquidVideo = new LiquidVideo([
      beverage.design.assets.liquidIntro,
      beverage.design.assets.liquidIdle
    ]);
    this._liquidVideo.x = liquidDimensions.left;
    this._liquidVideo.y = liquidDimensions.top;
    this._liquidVideo.width = liquidDimensions.width;
    this._liquidVideo.height = liquidDimensions.height;
    this._layerVideo.addChild(this._liquidVideo);

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
    this._layerVideo.addChild(this._bigBubbleMask);

    this._bigBubbleStroke = new BlobShape(
      transition.radius,
      0x00000000,
      JsUtil.toColorNumber(transition.beverage.design.colors.strokeHome),
      4,
      0.06,
      undefined,
      undefined,
      undefined,
      transition.randomSeed + 1
    );

    this._bigBubbleStroke.x = transition.focusedPosition.x;
    this._bigBubbleStroke.y = transition.focusedPosition.y;
    this._bigBubbleMask.rotation = 0 - transition.startRotation;
    this._layerVideo.addChild(this._bigBubbleStroke);

    this._liquidBackground.mask = this._bigBubbleMask;
    this._liquidVideo.mask = this._bigBubbleMask;

    await this._liquidVideo.prepare();
    console.log("1");

  }

  private async createFlavorsList(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.appInfo.isAda ? this.Platform.layout.brandFlavorsAda : this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorList = new FlavorList(
      beverage.flavors,
      beverage.maxFlavors,
      this.appInfo,
      dimensions.width,
      dimensions.height
    );

    this._flavorList.x = dimensions.left;
    this._flavorList.y = dimensions.top;

    this._flavorList.onChanged.add(this.onFlavorsChanged);
    this._layerControls.addChild(this._flavorList);

    await this._flavorList.prepare();
  }

  private async createFlavorsMix(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorMix = new FlavorMix(beverage, this.appInfo);
    this._flavorMix.x = dimensions.left;

    if (!this.appInfo.isAda) {
      this._flavorMix.y = dimensions.top + this._topPadding;
    } else {
      this._flavorMix.y = dimensions.top - this._topPadding / 2 + vh / 2;
    }
    this._layerControls.addChild(this._flavorMix);

    await this._flavorMix.prepare();
  }

  private async createLogo(beverage: PourableDesign, vw: number, vh: number) {
    const options = this._beverage.isMix
      ? this.appInfo.isAda
        ? this.Platform.layout.brandLogo_mix_ada
        : this.Platform.layout.brandLogo_mix
      : this.appInfo.isAda
        ? this.Platform.layout.brandLogo_ada
        : this.Platform.layout.brandLogo;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._logo = await createImageToFit(dimensions, beverage.design.assets.logoBrand);
    this._layerControls.addChild(this._logo);
  }

  private async createMastHead(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.Platform.layout.mastHead;
    const url = this.appInfo.ConfigurationData.idleState.mastheads;
    let urls = [];
    url.map((data) => {
      urls.push(data.url);
    })
    console.log(url);
    if (Number(options.width) !== 0) {
      this._mastHead = new LiquidVideo(urls);
      this._mastHead.x = options.x;
      this._mastHead.y = options.y;
      this._mastHead.width = options.width;
      this._mastHead.height = options.height;
      this._layerControls.addChild(this._mastHead);

      await this._mastHead.prepare();
    }
  }

  private createNavLabel(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeNavTitleAda
      : this.Platform.layout.homeNavTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._labelTouch1 = new Text(
      LocalizationService.LocalizeString("home.return.preTitle"),
      TextUtils.getStyleBody(22, 0xff3da5e7)
    );

    this._labelTouch2 = new Text(
      LocalizationService.LocalizeString("home.return.title"),
      TextUtils.getStyleBody(27, 0xff3da5e7)
    );

    this._labelTouch2.style.letterSpacing = 3;
    this._labelTouch2.style.padding = 5;

    this._labelTouch1.anchor.set(0.5, 0.5);
    this._labelTouch1.x =
      dimensions.left !== null && dimensions.width !== null
        ? dimensions.left + dimensions.width * 0.5
        : 0;

    this._labelTouch1.y = dimensions.top === null ? 0 : dimensions.top;

    this._labelTouch2.anchor.set(0.5, 0.5);
    this._labelTouch2.x =
      dimensions.left !== null && dimensions.width !== null
        ? dimensions.left + dimensions.width * 0.5
        : 0;
    this._labelTouch2.y = (dimensions.top === null ? 0 : dimensions.top) + 36;
    this._labelTouch1.interactive = true;
    this._labelTouch2.interactive = true;
    this._labelTouch1.buttonMode = true;
    this._labelTouch1.buttonMode = true;
    this._labelTouch1.on("click", this.gotoHomeOrigin);
    this._labelTouch2.on("click", this.gotoHomeOrigin);

    this._hitArea = new Box(0xffff0000, vh, vw - vw / 3);
    this._hitArea.x = 0;
    this._hitArea.y = 0;
    this._hitArea.interactive = true;
    this._hitArea.buttonMode = true;
    this._hitArea.alpha = 0;
    this._hitArea.on("click", this.gotoHomeOrigin);

    this._layerControls.addChild(this._hitArea);
    this._layerControls.addChild(this._labelTouch1);
    this._layerControls.addChild(this._labelTouch2);
  }

  private async createNutritionFacts(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.Platform.layout.container;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._calorieInfo = new CalorieInfo(beverage, dimensions);
    this._layerControls.addChild(this._calorieInfo);

    await this._calorieInfo.prepare();
  }

  private async createParticles(
    transition: SelectBrandTransition,
    vw: number,
    vh: number
  ) {
    let particleCreator;
    if (this.appInfo.isAda) {
      particleCreator = new ParticleCreatorFactoryLine(
        new Point(0, 1400),
        new Point(vw, 1400),
        400
      );
    } else {
      particleCreator = new ParticleCreatorFactoryCircle(
        transition.focusedPosition,
        transition.radius
      );
    }

    this._particleCreator = new ParticleCreator(
      particleCreator,
      this._beverage.design.particlesPerSecond,
      this._beverage.design.particlesSizeScale,
      this._beverage.design.particlesSpeedScale,
      this._beverage
    );

    this._layerBackground.addChild(this._particleCreator);
  }

  private async createPourButton(
    beverage: PourableDesign,
    vw: number,
    vh: number
  ) {
    const options = this.appInfo.isAda ? this.Platform.layout.brandButtonPourAda : this.Platform.layout.brandButtonPour;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = dimensions.width / 2;

    const { pourButtonArrowOffset, pourButtonContentScale } = this.appInfo.isAda ? this.Platform.brandConfigAda : this.Platform.brandConfig;

    const backgroundColor = this.appInfo.isAda ? JsUtil.toColorNumber(beverage.design.colors.strokeHome) + 4278190080 : 0x55332222;

    const pourButtonContent = new PourButtonContent(pourButtonArrowOffset);
    pourButtonContent.scale.set(pourButtonContentScale, pourButtonContentScale);

    this._pourButton = new CustomContentBlobButton(
      radius,
      JsUtil.toColorNumber(beverage.design.colors.strokeHome),
      backgroundColor,
      pourButtonContent  
    );

    if (this.appInfo.isAda) {
      this._pourButton._strokeAdaBack.visible = true;
      this._pourButton._strokeAdaBack.lineColor =
        JsUtil.toColorNumber(beverage.design.colors.animationLight);
      this._pourButton._strokeAdaBack.backgroundColor =
        JsUtil.toColorNumber(beverage.design.colors.animationLight);
      this._pourButton._strokeAdaBack.alpha = 0.2;
      this._pourButton._strokeBack.lineColor =
        JsUtil.toColorNumber(beverage.design.colors.animationDark) ;
      this._pourButton._strokeBack.backgroundColor =
        JsUtil.toColorNumber(beverage.design.colors.animationDark) ;
      console.log(beverage.design.colors.animationDark);
        this._pourButton._strokeBack.alpha = 0.8;
      this._pourButton._strokeFront.lineColor =
        JsUtil.toColorNumber(beverage.design.colors.strokeHome);
      this._pourButton._strokeFront.backgroundColor = JsUtil.toColorNumber("#FFFFFBBE");
      this._pourButton._strokeFront.alpha = 0.8; 
      
    }

    this._pourButton.x = radius + dimensions.left;
    this._pourButton.y = radius + dimensions.top;
    this._pourButton.onPressed.add(this.startPour);
    this._pourButton.onReleased.add(this.stopPour);

    this._layerControls.addChild(this._pourButton);

    if (this.appInfo.isAda) {
      this.appInfo.adaNavigationService.appendButton(this._pourButton);
    }
  }

  private gotoHomeOrigin() {
    this.appInfo.isAda = !this.appInfo.isAda;
    this.navigator.goTo(AppRoutes.getHome());
  }

  private onDataReady(e: ConfigurationData) {
    this._idleState = e.idleState;
  }

  private onFlavorsChanged(selectedFlavorIds: string[]) {
    // Backend.get().setFlavors(selectedFlavorIds);
  }

  private onPointerMove() {
    if (this.visible) {
      this.waitAndShowAttractor();
    }
  }

  private redrawVisibility() {
    if (
      !this.appInfo.isAda &&
      this.navigator.transition != null &&
      this.navigator.transition.type === "SelectBrand"
    ) {
      const selectBrandTransition = this.navigator
        .transition as SelectBrandTransition;

      const t = this._visibility;
      const uiVisibility = map(t, 0.5, 1, 0, 1, true);

      const qo: number = Easing.quintOut(t);
      const et: number = Easing.sineInOut(Easing.sineInOut(t));
      const uiPhase: number = map(this._visibility, 1, 0.7, 1, 0, true);

      this._pourButton.visibility = uiPhase;
      this._backButton.visibility = uiPhase;

      this.alpha = qo;
      if (!this.appInfo.isAda) {
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

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor(), null, new IdleTransition());
    this.appInfo.isAda = false;
    LocalizationService.setCurrentPrimaryOrSecondary("primary");
  }

  private startPour() {
    if (!this._beverage.isMix && HomeScreen._instance === null) {
      const flavors: PourItem[] = [];
      _.forEach(this._flavorList.selectedFlavors, (flavorDesign: FlavorDesign) => {
        flavors.push(flavorDesign.pourItem);
      });

      const pourArgs = new PourEventArgs(
        this._beverage.pourItem,
        flavors,
        this.objectId
      );  

      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
        .SetDataArgumentTo(pourArgs)
        .Send();
      this._isPourClicked = true;
      if (!this.appInfo.isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    } else if (this._beverage.isMix && HomeScreen._instance === null) {
      const flavors: PourItem[] = [];
      let beverage: PourableDesign;

      _.forEach(this.appInfo.ConfigurationData.pourables.flavors, (flavorDesign: FlavorDesign) => {
        for (let i = 0; i < this._beverage.pourItem.flavorIds.length; i++) {
          if (flavorDesign.id === this._beverage.pourItem.flavorIds[i]) {
            flavors.push(flavorDesign.pourItem);
          }
        }
      });

      _.forEach(this.appInfo.ConfigurationData.pourables.brands, (brand: PourableDesign) => {
        if (brand.id === this._beverage.pourItem.brandId) {
          beverage = brand;
        }
      });

      if (!beverage) {
        console.warn(
          "did not find brand, cannot pour",
          this._beverage.pourItem.brandId
        );
        return;
      }

      const pourArgs = new PourEventArgs(
        beverage.pourItem,
        flavors,
        this.objectId
      );

      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
        .SetDataArgumentTo(pourArgs)
        .Send();
      this._isPourClicked = true;

      if (!this.appInfo.isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    }
    if (this.visible) {
      this.waitAndShowAttractor();
    }
  }

  private stopPour() {
    if (HomeScreen._instance === null && this._isPourClicked) {
      PublishEvent.Create(PubSubTopic.stopPour, this.objectId).Send();
      this._isPourClicked = false;
    }
    if (!this.appInfo.isAda) {
      this._liquidVideo.pouredTarget = 0;
    }
    if (this.visible) {
      this.waitAndShowAttractor();
    }
  }
}
