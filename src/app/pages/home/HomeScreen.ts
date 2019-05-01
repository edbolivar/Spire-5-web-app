import { map } from "moremath";
import { Sprite, Text, Point, Rectangle } from "pixi.js";
import AbstractScreen from "../../display/navigation/AbstractScreen";
import AppRoutes from "../../display/navigation/AppRoutes";
import BlobButton from "../../display/components/BlobButton";
import LayoutUtils from "../../utils/LayoutUtils";
import MainMenu from "./MainMenu";
import TextUtils from "../../utils/TextUtils";
import Easing from "../../../transitions/Easing";
import { AppInfoService } from "../../services/app-info.service";
import { LocalizationService } from "../../services/localization.service";
import {
  PublishEvent,
  PubSubTopic,
  SubscribeEvent
} from "../../universal/pub-sub-types";
import {
  PourEventArgs,
  PourItem,
  DeviceInfo
} from "../../universal/app.types";
import { JsUtil } from "../../universal/JsUtil";
import { IdleTransition } from "../../display/navigation/IdleTransition";
import { BrandSelectedArgs } from "./BrandSelectedArgs";
import { SelectBrandTransition } from "../../display/navigation/SelectBrandTransition";
import BrandScreen from "../brand/BrandScreen";
import LiquidVideo from "../brand/LiquidVideo";

export default class HomeScreen extends AbstractScreen {
  static _instance: HomeScreen = null;

  private _buttonAda: BlobButton;
  private _buttonLanguage: BlobButton;
  private _buttonSparkingPourable: PourItem;
  private _buttonSparkling: BlobButton;
  private _buttonTap: BlobButton;
  private _buttonTapPourable: PourItem;
  private _dismissTimer: any;
  private _labelTouch1: Text;
  private _labelTouch2: Text;
  private _mastHead: LiquidVideo;
  private _menu: MainMenu;
  private _menuContainer: Sprite;
  private _preTitle: Text;
  private _preTitlePosition: Point;
  private _title: Text;
  private _titlePosition: Point;
  private _visibility: number;
  private _objectId: number;
  private _primaryOrSecondary: string;

  constructor(appInfo: AppInfoService) {
    super(appInfo);

    this.onLanguageChanged = this.onLanguageChanged.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.startPourSparkling = this.startPourSparkling.bind(this);
    this.startPourTap = this.startPourTap.bind(this);
    this.stopPour = this.stopPour.bind(this);
    this.toggleAdaStatus = this.toggleAdaStatus.bind(this);

    this._objectId = JsUtil.getObjectId();
    this._primaryOrSecondary = "primary";

    const watersPourableDesigns = this.appInfo.ConfigurationData.pourables
      .waters;

    // tap
    let waterDesign = watersPourableDesigns.find(i => i.id === "water-tap");
    if (waterDesign != null) {
      this._buttonTapPourable = waterDesign.pourItem;
    }

    // sparkling
    waterDesign = watersPourableDesigns.find(i => i.id === "water-sparkling");
    if (waterDesign != null) {
      this._buttonSparkingPourable = waterDesign.pourItem;
    }

    HomeScreen._instance = this;

    this.visibility = 0;
  }

  public destroy() {
    SubscribeEvent.UnSubscribeByConsumer(this._objectId);
    this.stopWaitingForAttractor();

    if (this._buttonTap) {
      this._buttonTap.destroy();
      delete this._buttonTap;
    }

    if (this._buttonSparkling) {
      this._buttonSparkling.destroy();
      delete this._buttonSparkling;
    }

    if (this._buttonAda) {
      this._buttonAda.destroy();
      delete this._buttonAda;
    }

    if (this._buttonLanguage) {
      this._buttonLanguage.destroy();
      delete this._buttonLanguage;
    }

    if (this._mastHead) {
      this._mastHead.destroy();
      delete this._mastHead;
    }

    if (this._menu) {
      this._menu.destroy();
      delete this._menu;
    }

    if (this._menuContainer) {
      this._menuContainer.destroy();
      delete this._menuContainer;
    }

    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(
      this._objectId
    );

    HomeScreen._instance = null;

    super.destroy();
  }

  public async hide() {
    this.stopWaitingForAttractor();
  }
 
  public async prepareToHide() {
    this.interactive = false;
    this.removeAllListeners();

    this.stopWaitingForAttractor();

    if (this._menu) {
      this._menu.stop();
    }
  }

  public async prepareToShow() {
    PublishEvent.Create(PubSubTopic.changeDx3Lighting, this._objectId)
      .SetDataArgumentTo("#ffffff")
      .Send();

    const vw = this.Platform.width;
    const vh = this.Platform.height;

    // Create all elements
    this.appInfo.adaNavigationService.releaseButtons();
    this.createPreTitle(vw, vh);
    this.createTitle(vw, vh);
    this.createTapWaterButton(vw, vh);
    this.createSparklingWaterButton(vw, vh);
    this.createMastHead(vw, vh);

    this.alpha = 0;
    if (
      LocalizationService.instance.localizationModel.secondaryLocalization.getHasItems()
    ) {
      this.createLanguageButton(vw, vh);
    }

    if (Number(this.Platform.layout.mastHead.width) !== 0) {
      const preparelist = [this._mastHead.prepare()];
      await Promise.all(preparelist);
      this._mastHead.play();
      this.createMainMenu(vw, vh);
      if (this._menu != null) {
        this.createAdaButton(vw, vh);
      }
    } else {
      this.createMainMenu(vw, vh);
      if (this._menu != null) {
        this.createAdaButton(vw, vh);
      }
    }

    // Initial settings
    this.visibility = 0;

    this.interactive = true;
    this.on("pointermove", this.onPointerMove);
  }

  public async show() {
    this.waitAndShowAttractor();

    if (this._menu != null) {
      this._menu.start();
    }
  }
  
  public stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
  }

  public toggleAdaStatus() {
    const vw = this.Platform.width;
    const vh = this.Platform.height;
    this.appInfo.isAda = !this.appInfo.isAda;

    PublishEvent.Create(PubSubTopic.adaModeChanged, this._objectId)
      .SetDataArgumentTo(this.appInfo.isAda)
      .Send();

    this._menu.destroy();
    if (this._menuContainer) {
      this._menuContainer.destroy();
    }

    this.createMainMenu(vw, vh);

    if (this._menu.redraw) {
      this._menu.redraw(this.appInfo.isAda);
    }

    this._title.destroy();
    this._preTitle.destroy();

    if (this._buttonLanguage) {
      this._buttonLanguage.destroy();
    }
    if (this._buttonTap) {
      this._buttonTap.destroy();
    }

    if (this._buttonSparkling) {
      this._buttonSparkling.destroy();
    }
    this.createPreTitle(vw, vh);
    this.createTitle(vw, vh);

    if (
      LocalizationService.instance.localizationModel.secondaryLocalization.getHasItems()
    ) {
      this.createLanguageButton(vw, vh);
    }

    this.createTapWaterButton(vw, vh);
    this.createSparklingWaterButton(vw, vh);
    this.redrawVisibility();
  }

  public async transition(transitionInfluence: number) {
    this.visibility = transitionInfluence;

    if (this._menu) {
      this._menu.transition = this.navigator.transition;
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

  public waitAndShowAttractor() {
    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout(() => {
      this.showAttractor();
      this.appInfo.isAda = false;

      PublishEvent.Create(PubSubTopic.adaModeChanged, this._objectId)
        .SetDataArgumentTo(this.appInfo.isAda)
        .Send();
    }, this.idleState.delayHome * 1000);
  }

  private createAdaButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = (dimensions.width | dimensions.height | 0) / 2;

    const { adaIconScale } = this.Platform.blobButton;
    
    this._buttonAda = new BlobButton(
      null,
      null,
      radius,
      0xff3da5e7,
      0xffffffff,
      "assets/ui/icon_ada.png",
      adaIconScale,
      0xff3291e0,
      false
    );

    this._buttonAda.x = radius + (dimensions.left || 0);
    this._buttonAda.y = radius + (dimensions.top || 0);
    this.addChild(this._buttonAda);
    this.appInfo.adaNavigationService._selectedButton.isFocused = this.appInfo
      .isAda
      ? true
      : false;

    this._buttonAda.onPressed.add(() => {
      this.toggleAdaStatus();
      this._buttonAda.strokeFrontBackground = this.appInfo.isAda
        ? 0xff3291e0
        : 0xffffffff;
      this._buttonAda.iconColor = this.appInfo.isAda ? 0xffffffff : 0xff3291e0;
    });
  }

  private createLanguageButton(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeButtonLanguageAda
      : this.Platform.layout.homeButtonLanguage;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = "home.pour.language.preTitle";
    const titleResourceId = "home.secondary.language";

    this._buttonLanguage = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    this._buttonLanguage.onPressed.add(this.onLanguageChanged);
  }

  private createMainMenu(vw: number, vh: number) {
    const homeMenuConfig = this.Platform.homeMenu;

    const dimensions = LayoutUtils.parseLayoutRectangle(
      homeMenuConfig,
      vw,
      vh,
      this.appInfo.isAda,
      homeMenuConfig.adabottom
    );

    const viewport = new Rectangle(
      dimensions.left === null ? 0 : dimensions.left,
      dimensions.top === null ? 0 : dimensions.top,
      dimensions.width === null ? vw : dimensions.width,
      dimensions.height === null ? vh : dimensions.height
    );

    if (this.appInfo.isAda) {
      if (homeMenuConfig.hasOwnProperty("adaleft")) {
        viewport.x = LayoutUtils.parseUnits(homeMenuConfig.adaleft, vw, vh);
      }
    }

    this._menuContainer = new Sprite();
    this.addChild(this._menuContainer);

    this._menu = new MainMenu(this.appInfo);
    const menuSize = {
      width: this._menu.width,
      height: this._menu.height
    };

    const menuRect = LayoutUtils.fitInsideRectangle(menuSize, viewport);
    this._menu.x = viewport.x + menuRect.x;
    this._menu.y = viewport.y + menuRect.y;
    this._menu.width = menuRect.width;
    this._menu.height = menuRect.height;
    this._menu.onTappedBrand.add(brandSelectedArgs => {
      if (
        brandSelectedArgs.beverage.pourItem.isDisabled === false &&
        BrandScreen._instance === null
      ) {
        this.openBrandScreen(brandSelectedArgs);
      }
    });

    this._menuContainer.addChild(this._menu);
  }

  private createMastHead(vw: number, vh: number) {
    const options = this.Platform.layout.mastHead;
    const url = this.appInfo.ConfigurationData.idleState.mastheads;
    let urls = [];
    url.map((data) => {
      urls.push(data.url);
    })
    
    if (options.width !== 0) {
      this._mastHead = new LiquidVideo(urls);
      this._mastHead.x = options.x;
      this._mastHead.y = options.y;
      this._mastHead.width = options.width;
      this._mastHead.height = options.height;
      this.addChild(this._mastHead);
    }
  }

  private createNavLabel(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeNavTitleAda
      : this.Platform.layout.homeNavTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    const navLabelPreTitle = LocalizationService.LocalizeString(
      "home.return.preTitle"
    );
    const navLabelTitle = LocalizationService.LocalizeString(
      "home.return.title"
    );

    this._labelTouch1 = new Text(
      navLabelPreTitle,
      TextUtils.getStyleBody(22, 0xff3da5e7)
    );

    this._labelTouch2 = new Text(
      navLabelTitle,
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
    this._labelTouch1.on("click", this.toggleAdaStatus);
    this._labelTouch2.on("click", this.toggleAdaStatus);

    LocalizationService.instance.registerPixiTextObject(
      "home.return.preTitle",
      this._labelTouch1,
      this._objectId
    );

    LocalizationService.instance.registerPixiTextObject(
      "home.return.title",
      this._labelTouch2,
      this._objectId
    );

    this.addChild(this._labelTouch1);
    this.addChild(this._labelTouch2);
  }

  private createPreTitle(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homePreTitleAda
      : this.Platform.layout.homePreTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._preTitle = this.createText(
      dimensions,
      "home.preTitle",
      21,
      0x33aadd,
      4
    );

    this._preTitlePosition = new Point(
      this._preTitle.position.x,
      this._preTitle.position.y
    );
  }

  private createSparklingWaterButton(vw: number, vh: number) {
    if (!this._buttonSparkingPourable) {
      return;
    }
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeButtonSparklingAda
      : this.Platform.layout.homeButtonSparkling;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = "home.pour.sparkling.preTitle";
    const titleResourceId = "home.pour.sparkling.title";

    this._buttonSparkling = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    if (!DeviceInfo.unitState.ShowSparklingWaterButton) {
      this._buttonSparkling.visible = false;
    }
    this._buttonSparkling.onPressed.add(this.startPourSparkling);
    this._buttonSparkling.onReleased.add(this.stopPour);
  }

  private createTapWaterButton(vw: number, vh: number) {
    if (!this._buttonTapPourable) {
      return;
    }
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeButtonTapAda
      : this.Platform.layout.homeButtonTap;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = "home.pour.tap.preTitle";
    const titleResourceId = "home.pour.tap.title";

    this._buttonTap = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    if (DeviceInfo.unitState.ShowStillWaterButton === false) {
      this._buttonTap.visible = false;
    }
    this._buttonTap.onPressed.add(this.startPourTap);
    this._buttonTap.onReleased.add(this.stopPour);
  }

  private createText(
    dimensions: Rectangle,
    resourceId: string,
    size: number,
    color: number,
    letterSpacing: number = 1
  ) {
    const text = new Text(
      LocalizationService.LocalizeString(resourceId),
      TextUtils.getStyleBody(size, color)
    );

    text.style.letterSpacing = letterSpacing;
    text.anchor.set(0.5, 0);
    text.x =
      dimensions.left !== null && dimensions.width !== null
        ? dimensions.left + dimensions.width * 0.5
        : 0;
    text.y = dimensions.top === null ? 0 : dimensions.top;
    this.addChild(text);

    LocalizationService.instance.registerPixiTextObject(
      resourceId,
      text,
      this._objectId
    );

    return text;
  }

  private createTitle(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homeTitleAda
      : this.Platform.layout.homeTitle;

    if (this.appInfo.isAda === true) {
      this.createNavLabel(vw, vh);
    } else if (this.appInfo.isAda === false && this._labelTouch1 != null) {
      this._labelTouch1.visible = false;
      this._labelTouch2.visible = false;
    }

    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._title = this.createText(dimensions, "home.title", 80, 0x778888, 2);

    this._titlePosition = new Point(
      this._title.position.x,
      this._title.position.y
    );
  }

  private createWaterButton(
    dimensions: Rectangle,
    preTitleResourceId: string,
    titleResourceId: string
  ) {
    const radius = dimensions.width
      ? dimensions.width / 2
      : dimensions.height
        ? dimensions.height / 2
        : 0;

    const button = new BlobButton(
      preTitleResourceId,
      titleResourceId,
      radius,
      0xff3da5e7,
      0xffffffff,
      "assets/ui/arrow-pour.png",
      0.1,
      0xd2d6db
    ); // Pepsi stroke
    button.x = radius + (dimensions.left || 0);
    button.y = radius + (dimensions.top || 0);

    this.addChild(button);
    return button;
  }

  private onLanguageChanged() {
    if (this._primaryOrSecondary === "primary") {
      this._primaryOrSecondary = "secondary";
      LocalizationService.setCurrentPrimaryOrSecondary(this._primaryOrSecondary);
    } else {
      this._primaryOrSecondary = "primary";
      LocalizationService.setCurrentPrimaryOrSecondary(this._primaryOrSecondary);
    }
  }

  private onPointerMove() {
    if (this._visibility > 0) {
      this.waitAndShowAttractor();
    }
  }

  private openBrandScreen(brandSelectedArgs: BrandSelectedArgs) {
    const route = AppRoutes.getBrand(brandSelectedArgs.beverage.id);
    const transition = new SelectBrandTransition(
      this.Platform,
      brandSelectedArgs.beverage,
      brandSelectedArgs.rotationSpeed,
      brandSelectedArgs.startRotation,
      brandSelectedArgs.startPosition,
      brandSelectedArgs.startRadius
    );

    this.navigator.goTo(route, null, transition);
  }

  private publishStartPourEvent(pourArgs: PourEventArgs) {
    PublishEvent.Create(PubSubTopic.startPour, this._objectId)
      .SetDataArgumentTo(pourArgs)
      .Send();
  }

  private redrawVisibility() {
    this.alpha = 1;
    const uiVisibility = map(this.visibility, 1, 0.7, 1, 0, true);

    if (this._menu) {
      this._menu.visibility = this._visibility;
    }

    if (this._buttonTap != null) {
      this._buttonTap.visibility = uiVisibility;
    }

    if (this._buttonSparkling != null) {
      this._buttonSparkling.visibility = uiVisibility;
    }

    const labelTouchVisibility = map(this.visibility, 0.4, 0, 1, 0, true);

    if (this._labelTouch1) {
      this._labelTouch1.alpha = labelTouchVisibility;
    }

    if (this._labelTouch2) {
      this._labelTouch2.alpha = labelTouchVisibility;
    }
    
    if (this._buttonAda) {
      this._buttonAda.strokeFrontBackground = this.appInfo.isAda
        ? 0xff197af1
        : 0xffffffff;
      this._buttonAda.iconColor = this.appInfo.isAda ? 0xffffffff : 0xff3da5e7;
      this._buttonAda.visibility = uiVisibility;
    }

    if (this._buttonLanguage) {
      this._buttonLanguage.visibility = uiVisibility;
    }

    if (this._preTitle != null) {
      this._preTitle.alpha = uiVisibility;
      this._preTitle.y = map(
        Easing.expoOut(uiVisibility),
        0,
        1,
        0 - this._preTitle.height,
        this._preTitlePosition.y
      );
    }

    if (this._title != null) {
      this._title.alpha = uiVisibility;
      this._title.y = map(
        Easing.expoOut(uiVisibility),
        0,
        1,
        0 - this._title.height,
        this._titlePosition.y
      );
    }
  }

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor(), null, new IdleTransition());
    this._primaryOrSecondary = "primary";
    LocalizationService.setCurrentPrimaryOrSecondary(this._primaryOrSecondary);
  }

  private startPourSparkling() {
    const pourArgs = new PourEventArgs(
      this._buttonSparkingPourable,
      [],
      this._objectId
    );

    if (BrandScreen._instance == null || BrandScreen._instance.alpha === 0) {
      this.publishStartPourEvent(pourArgs);
    }
  }

  private startPourTap() {
    const pourArgs = new PourEventArgs(
      this._buttonTapPourable,
      [],
      this._objectId
    );
    if (BrandScreen._instance == null || BrandScreen._instance.alpha === 0) {
      this.publishStartPourEvent(pourArgs);
    }
  }

  private stopPour() {
    PublishEvent.Create(PubSubTopic.stopPour, this._objectId).Send();
  }
}
