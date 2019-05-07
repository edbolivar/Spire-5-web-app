import { map } from 'moremath';
import { Sprite, Text, Point } from 'pixi.js';
import AbstractScreen from '../../display/navigation/AbstractScreen';
import AppRoutes from '../../display/navigation/AppRoutes';
import BlobButton from '../../display/components/BlobButton';
import LayoutUtils from '../../utils/LayoutUtils';
import { LayoutRectangle } from '../../utils/LayoutUtils';
import MainMenu from './MainMenu';
import TextUtils from '../../utils/TextUtils';
import Easing from '../../../transitions/Easing';
import { AppInfoService } from '../../services/app-info.service';
import { LocalizationService } from '../../services/localization.service';
import {
  PublishEvent,
  PubSubTopic,
  SubscribeEvent
} from '../../universal/pub-sub-types';
import { PourEventArgs, PourItem } from '../../universal/app.types';
import { JsUtil } from '../../universal/JsUtil';
import { LayoutContainer } from '../../layout/LayoutContainer';
import { IdleTransition } from '../../display/navigation/IdleTransition';
import { BrandSelectedArgs } from './BrandSelectedArgs';
import { SelectBrandTransition } from '../../display/navigation/SelectBrandTransition';
import Box from '../../display/shapes/Box';


export default class HomeScreen extends AbstractScreen {
  static _instance: HomeScreen = null;

  private _visibility: number;
  private _menuContainer: Sprite;
  private _menu: MainMenu;
  private _buttonTap: BlobButton;
  private _buttonLanguage: BlobButton;
  private _buttonSparkling: BlobButton;
  private _buttonTapPourable: PourItem;
  private _buttonSparkingPourable: PourItem;
  private _preTitle: Text;
  private _preTitlePosition: Point;
  private _title: Text;
  private _titlePosition: Point;
  private _dismissTimer: any;
  private _buttonAda: BlobButton;
  private _labelTouch1: Text;
  private _labelTouch2: Text;

  private objectId: number;

  _homeLayoutContainer: LayoutContainer;
  private primaryOrsecondary: string;

  constructor(appInfo: AppInfoService) {
    super(appInfo);
    this.objectId = JsUtil.getObjectId();
    this.primaryOrsecondary = 'primary';

    const watersPourableDesigns = this.appInfo.ConfigurationData.pourables
      .waters;

    this._buttonTapPourable = watersPourableDesigns.find(
      i => i.id === 'water-tap'
    ).pourItem;
    this._buttonSparkingPourable = watersPourableDesigns.find(
      i => i.id === 'water-sparkling'
    ).pourItem;

    HomeScreen._instance = this;

    this.visibility = 0;
  }

  public async prepareToShow() {
    const vw = this.Platform.width;
    const vh = this.Platform.height;
    console.log(this.appInfo.isAda);
    // Create all elements
    this.createPreTitle(vw, vh);
    this.createTitle(vw, vh);
    this.createMainMenu(vw, vh);
    this.createTapWaterButton(vw, vh);
    this.createSparklingWaterButton(vw, vh);
    this.createAdaButton(vw, vh);
    this.alpha = 0;
    if (
      LocalizationService.instance.localizationModel.secondaryLocalization.getHasItems()
    ) {
      this.createLanguageButton(vw, vh);
    }
    // Initial settings
    this.visibility = 0;

    this.interactive = true;
    this.on('pointermove', this.onPointerMove.bind(this));
  }

  public async prepareToHide() {
    this.interactive = false;
    this.removeAllListeners();

    this.stopWaitingForAttractor();

    if (this._menu) {
      this._menu.stop();
    }
  }

  public async show() {
    this.waitAndShowAttractor();

    if (this._menu != null) {
      this._menu.start();
    }
  }

  public async transition(transitionInfluence: number) {
    this.visibility = transitionInfluence;

    if (this._menu) {
      this._menu.transition = this.navigator.transition;
    }
  }

  public async hide() {
    this.stopWaitingForAttractor();
  }

  public destroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);

    console.log('home.destroy');
    this.stopWaitingForAttractor();
    this._buttonTap.destroy();
    this._buttonSparkling.destroy();
    this._buttonAda.destroy();
    this._menu.destroy();
    this._menuContainer.destroy();
    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(
      this.objectId
    );

    if (this._homeLayoutContainer) {
      this._homeLayoutContainer.destroy();
    }
    // if(!this.appInfo.isAda) {
    //   this._labelTouch1.destroy();
    //   this._labelTouch2.destroy();

    // }
    HomeScreen._instance = null;
    super.destroy();
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

  private onPointerMove() {
    if (this._visibility > 0) {
      this.waitAndShowAttractor();
    }
  }

  private createNavLabel(vw: number, vh: number) {
    console.log("drawing NavLable");
    this._labelTouch1 = new Text(
      'TOUCH HERE TO',
      TextUtils.getStyleBody(36, 0xff197af1)
    );

    this._labelTouch2 = new Text(
      'RETURN TO FULL SCREEN',
      TextUtils.getStyleBody(46, 0xff197af1)
    );

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
    this._labelTouch1.on('click', this.toggleAdaStatus.bind(this));
    this._labelTouch2.on('click', this.toggleAdaStatus.bind(this));

    this.addChild(this._labelTouch1);
    this.addChild(this._labelTouch2);
  }

  private createPreTitle(vw: number, vh: number) {
    const options = this.appInfo.isAda
      ? this.Platform.layout.homePreTitleAda
      : this.Platform.layout.homePreTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._preTitle = this.createText(dimensions, 'home.preTitle', 26, 0x0951ce);

    this._preTitlePosition = new Point(
      this._preTitle.position.x,
      this._preTitle.position.y
    );
  }

  // private createTitle(vw: number, vh: number) {
  //   const options = this.appInfo.isAda
  //     ? this.Platform.layout.homeTitleAda
  //     : this.Platform.layout.homeTitle;
      
  //   if(this.appInfo.isAda === true){
  //     console.log(this.appInfo.isAda);
  //     this.createNavLabel(vw,vh);
  //   } else if(this.appInfo.isAda === false && this._labelTouch1 != null){
  //     this._labelTouch1.visible = false;
  //     this._labelTouch2.visible = false;
  //   }
  //   const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
  //   this._title = this.createText(dimensions, 'home.title', 52, 0xff000000);

  //   this._titlePosition = new Point(
  //     this._title.position.x,
  //     this._title.position.y
  //   );
  }

  private createText(
    dimensions: LayoutRectangle,
    resourceId: string,
    size: number,
    color: number
  ) {
    const self = this;
    const text = new Text(
      LocalizationService.LocalizeString(resourceId),
      TextUtils.getStyleBody(size, color)
    );

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
      self.objectId
    );

    return text;
  }

  private createMainMenu(vw: number, vh: number) {
    const homeMenuConfig = this.Platform.layout.homeMenu;
    const dimensions = LayoutUtils.parseLayoutRectangle(homeMenuConfig, vw, vh);
    const viewport = {
      x: dimensions.left === null ? 0 : dimensions.left,
      y: dimensions.top === null ? 0 : dimensions.top,
      width: dimensions.width === null ? vw : dimensions.width,
      height: dimensions.height === null ? vh : dimensions.height
    };

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
      if (brandSelectedArgs.beverage.pourItem.isDisabled === false) {
        this.openBrandScreen(brandSelectedArgs);
      }
    });

    this._menuContainer.addChild(this._menu);

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

  private createTapWaterButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonTap;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.tap.preTitle';
    const titleResourceId = 'home.pour.tap.title';

    this._buttonTap = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    this._buttonTap.onPressed.add(this.startPourTap.bind(this));
    this._buttonTap.onReleased.add(this.stopPour.bind(this));
  }

  private createLanguageButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonLanguage;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.language.preTitle';
    const titleResourceId = 'home.secondary.language';

    this._buttonLanguage = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    this._buttonLanguage.onPressed.add(this.languageChanged.bind(this));
  }

  private createSparklingWaterButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonSparkling;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.sparkling.preTitle';
    const titleResourceId = 'home.pour.sparkling.title';

    this._buttonSparkling = this.createWaterButton(
      dimensions,
      preTitleResourceId,
      titleResourceId
    );
    this._buttonSparkling.onPressed.add(this.startPourSparkling.bind(this));
    this._buttonSparkling.onReleased.add(this.stopPour.bind(this));
  }

  private createWaterButton(
    dimensions: LayoutRectangle,
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
      0xff197af1,
      0xffffffff,
      'assets/ui/arrow-pour.png',
      0.16,
      0xbbbbbb
    ); // Pepsi stroke
    button.x = radius + (dimensions.left || 0);
    button.y = radius + (dimensions.top || 0);

    this.addChild(button);
    return button;
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

    this._buttonAda.x = radius + (dimensions.left || 0);
    this._buttonAda.y = radius + (dimensions.top || 0);
    this.addChild(this._buttonAda);
    this.appInfo.adaNavigationService._selectedButton.isFocused = this.appInfo.isAda ? true : false; 

    this._buttonAda.onPressed.add(() => {
      this.toggleAdaStatus();
    });
  }

  // toggleAdaStatus() {
  //   const vw = this.Platform.width;
  //   const vh = this.Platform.height;
  //   this.appInfo.isAda = !this.appInfo.isAda;
  //   if (this._menu.redraw) {
  //     this._menu.redraw(this.appInfo.isAda);
  //   }
  //   this._title.destroy();
  //   this._preTitle.destroy();
  //   this.createPreTitle(vw, vh);
  //   this.createTitle(vw, vh);
  //   this.redrawVisibility();
  // }

  private redrawVisibility() {
    this.alpha = 1;
    const uiVisibility = map(this.visibility, 1, 0.7, 1, 0, true);

    if (this._menu) {
      this._menu.visibility = this._visibility;
    }

    if (this._buttonTap != null) {
      this._buttonTap.alpha = uiVisibility;
    }

    if (this._buttonSparkling != null) {
      this._buttonSparkling.alpha = uiVisibility;
    }

    if (this._buttonAda) {
      this._buttonAda.strokeFrontBackground = this.appInfo.isAda
        ? 0xff197af1
        : 0xffffffff;
      this._buttonAda.iconColor = this.appInfo.isAda ? 0xffffffff : 0xff197af1;
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

  public waitAndShowAttractor() {
    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout(() => {
      this.showAttractor();
    }, this.idleState.delayHome * 3000);
  }

  public stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
  }

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor(), null, new IdleTransition());
  }

  private startPourTap() {
    const pourArgs = new PourEventArgs(
      this._buttonTapPourable,
      [],
      this.objectId
    );
    this.publishStartPourEvent(pourArgs);
  }

  private startPourSparkling() {
    const pourArgs = new PourEventArgs(
      this._buttonSparkingPourable,
      [],
      this.objectId
    );
    this.publishStartPourEvent(pourArgs);
  }

  private publishStartPourEvent(pourArgs: PourEventArgs) {
    console.log('sending start pour', pourArgs);

    PublishEvent.Create(PubSubTopic.startPour, this.objectId)
      .SetDataArgumentTo(pourArgs)
      .Send();
  }

  private stopPour() {
    console.log('sending stop pour');
    PublishEvent.Create(PubSubTopic.stopPour, this.objectId).Send();
  }

  private languageChanged() {
    if (this.primaryOrsecondary === 'primary') {
      this.primaryOrsecondary = 'secondary';
      LocalizationService.setCurrentPrimaryOrSecondary(this.primaryOrsecondary);
    } else {
      this.primaryOrsecondary = 'primary';
      LocalizationService.setCurrentPrimaryOrSecondary(this.primaryOrsecondary);
    }
  }
}
