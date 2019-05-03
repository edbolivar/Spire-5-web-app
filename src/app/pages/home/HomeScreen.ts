import {map} from 'moremath';
import {Sprite, Text} from 'pixi.js';
import AbstractScreen from '../../display/navigation/AbstractScreen';
import AppRoutes from '../../display/navigation/AppRoutes';

import BlobButton from '../../display/components/BlobButton';


import LayoutUtils from '../../utils/LayoutUtils';

import {LayoutRectangle} from '../../utils/LayoutUtils';
import MainMenu from './MainMenu';
import TextUtils from '../../utils/TextUtils';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import {AppInfoService} from '../../services/app-info.service';
import {LocalizationService} from '../../services/localization.service';
import {PublishEvent, PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../../universal/pub-sub-types';
import {
  FlavorDesign,
  LocalizedItems,
  PixiTextByResourceId,
  PourableDesign,
  PourEventArgs,
  PourItem
} from '../../universal/app.types';
import {JsUtil} from '../../universal/JsUtil';
import {Local} from 'protractor/built/driverProviders';
import {resource} from 'selenium-webdriver/http';
import { LayoutContainer } from '../../layout/LayoutContainer';
import * as _ from 'lodash';
import BrandBlobButton from './BrandBlobButton';
import { LayoutItem } from '../../layout/LayoutItem';
import LayoutAsSprite from '../../layout/LayoutAsSprite';
import { WrapLayoutMethod } from '../../layout/WrapLayoutMethod';
import Box from '../../display/shapes/Box';
import { PixiColors } from '../../utils/PixiColors';

export default class HomeScreen extends AbstractScreen {

  private _visibility: number;
  private _menuContainer: Sprite;
  private _menu: MainMenu;
  private _buttonTap: BlobButton;
  private _buttonLanguage: BlobButton;
  private _buttonSparkling: BlobButton;
  private _buttonTapPourable: PourItem;
  private _buttonSparkingPourable: PourItem;
  private _preTitle: Text;
  private _title: Text;
  private _dismissTimer: any;
  public static  _isAda: boolean = false;
  private _buttonAda: BlobButton;
  private objectId: number;

  _homeLayoutContainer: LayoutContainer;
  private _isDestroyed = false;
  private primaryOrsecondary: string;

  constructor(appInfo: AppInfoService) {
    super(appInfo);

    this.objectId = JsUtil.getObjectId();
    this.primaryOrsecondary = 'primary';
    console.log('AppInfo: ', appInfo);

    const watersPourableDesigns = this.appInfo.ConfigurationData.pourables.waters;

    this._buttonTapPourable = watersPourableDesigns.find(i => i.id === 'water-tap').pourItem;
    this._buttonSparkingPourable = watersPourableDesigns.find(i => i.id === 'water-sparkling').pourItem;

    this.visibility = 0;
  }

  public prepare(): Promise<void> {
    return new Promise((resolve) => {
      const vw = this.Platform.width;
      const vh = this.Platform.height;

      // Create all elements
      this.createPreTitle(vw, vh);
      this.createTitle(vw, vh);
      this.createMainMenu(vw, vh);
      this.createTapWaterButton(vw, vh);
      this.createSparklingWaterButton(vw, vh);
      this.createAdaButton(vw, vh);

      // for test layout
      // this.createTestLayout(vw, vh);


      if (LocalizationService.instance.localizationModel.secondaryLocalization.getHasItems()) {
        this.createLanguageButton(vw, vh);
      }
      // Initial settings
      this.visibility = 0;

      // this._isAda = false;

      this.interactive = true;
      this.on('pointermove', this.onPointerMove.bind(this));

      resolve();
    });
  }

  public show(previousRoute?: string): Promise<void> {
    return new Promise((resolve) => {
      this.visibility = 0;
      Fween
        .use(this)
        .to({visibility: 1}, 1)
        .call(() => {
          this.waitAndShowAttractor();
          resolve();
        }).play();
    });
  }

  public hide(nextRoute?: string): Promise<void> {
    this.stopWaitingForAttractor();
    return new Promise((resolve) => {
      Fween
        .use(this)
        .to({visibility: 0}, 0.75)
        .call(resolve).play();
    });
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
    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(this.objectId);

    if (this._homeLayoutContainer) {
      this._homeLayoutContainer.destroy();
    }

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

  private createPreTitle(vw: number, vh: number) {
    const options = (HomeScreen._isAda) ? this.Platform.layout.homePreTitleAda : this.Platform.layout.homePreTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._preTitle = this.createText(dimensions, 'home.preTitle', 26, 0x0951ce);
  }

  private createTitle(vw: number, vh: number) {
    const options = (HomeScreen._isAda) ? this.Platform.layout.homeTitleAda : this.Platform.layout.homeTitle;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._title = this.createText(dimensions, 'home.title', 52, 0xaaaaaa);
  }

  private createText(dimensions: LayoutRectangle, resourceId: string, size: number, color: number) {
    const self = this;
    const text = new Text(LocalizationService.LocalizeString(resourceId), TextUtils.getStyleBody(size, color));

    text.anchor.set(0.5, 0);
    text.x = dimensions.left !== null && dimensions.width !== null ? dimensions.left + dimensions.width * 0.5 : 0;
    text.y = dimensions.top === null ? 0 : dimensions.top;
    this.addChild(text);

    LocalizationService.instance.registerPixiTextObject(resourceId, text, self.objectId);

    return text;
  }

  private createMainMenu(vw: number, vh: number) {  
    const options = this.Platform.layout.homeMenu;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const viewport = {
      x: dimensions.left === null ? 0 : dimensions.left,
      y: dimensions.top === null ? 0 : dimensions.top,
      width: dimensions.width === null ? vw : dimensions.width,
      height: dimensions.height === null ? vh : dimensions.height,
    };

    this._menuContainer = new Sprite();
    this.addChild(this._menuContainer);

    this._menu = new MainMenu(this.appInfo);
    const menuSize = {
      width: this._menu.width,
      height: this._menu.height,
    };
    
    const menuRect = LayoutUtils.fitInsideRectangle(menuSize, viewport);
    this._menu.x = viewport.x + menuRect.x;
    this._menu.y = viewport.y + menuRect.y;
    this._menu.width = menuRect.width;
    this._menu.height = menuRect.height;
    this._menu.onTappedBrand.add((brandId) => {
      this.openBrandScreen(brandId);
    });
    this._menuContainer.addChild(this._menu);

  }

  private openBrandScreen(brandId: string) {
    this.navigator.goTo(AppRoutes.getBrand(brandId));
  }

  private createTapWaterButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonTap;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.tap.preTitle';
    const titleResourceId = 'home.pour.tap.title';

    this._buttonTap = this.createWaterButton(dimensions, preTitleResourceId, titleResourceId);
    this._buttonTap.onPressed.add(this.startPourTap.bind(this));
    this._buttonTap.onReleased.add(this.stopPour.bind(this));
  }

  private createLanguageButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonLanguage;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.language.preTitle';
    const titleResourceId = 'home.secondary.language';

    this._buttonLanguage = this.createWaterButton(dimensions, preTitleResourceId, titleResourceId);
    this._buttonLanguage.onPressed.add(this.languageChanged.bind(this));
  }

  private createSparklingWaterButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonSparkling;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitleResourceId = 'home.pour.sparkling.preTitle';
    const titleResourceId = 'home.pour.sparkling.title';

    this._buttonSparkling = this.createWaterButton(dimensions, preTitleResourceId, titleResourceId);
    this._buttonSparkling.onPressed.add(this.startPourSparkling.bind(this));
    this._buttonSparkling.onReleased.add(this.stopPour.bind(this));
  }

  private createWaterButton(dimensions: LayoutRectangle, preTitleResourceId: string, titleResourceId: string) {
    const radius = dimensions.width ? dimensions.width / 2 : (dimensions.height ? dimensions.height / 2 : 0);
    const button = new BlobButton(preTitleResourceId, titleResourceId, radius, 0xff197af1, 0xffffffff, 'assets/ui/arrow-pour.png', 0.16, 0xbbbbbb); // Pepsi stroke
    button.x = radius + (dimensions.left || 0);
    button.y = radius + (dimensions.top || 0);

    this.addChild(button);
    return button;
  }

  private createAdaButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = dimensions.width ? dimensions.width / 2 : (dimensions.height ? dimensions.height / 2 : 0);
    this._buttonAda = new BlobButton(null, null, radius, 0xff197af1, 0xffffffff, 'assets/ui/icon_ada.png', 1, 0xff197af1, false);
    this._buttonAda.x = radius + (dimensions.left || 0);
    this._buttonAda.y = radius + (dimensions.top || 0);
    this.addChild(this._buttonAda);
    this._buttonAda.onPressed.add(() => {
      HomeScreen._isAda = !HomeScreen._isAda;
        // this._menu.redraw(HomeScreen._isAda);
        this._menu.destroy();
        this.createMainMenu(this.Platform.width, this.Platform.height);
        this.redrawVisibility();
    });
  }

  private redrawVisibility() {

    const f = Easing.quintOut(this._visibility);
    this.visible = f > 0;
    this.alpha = f;
    const scale = map(f, 0, 1, 0.75, 1);

    // console.log('scale is', scale);

    if (this._menu) {
      this._menu.visibility = this._visibility;
    }

    if (this._preTitle) {
      const vw = this.Platform.width;
      const vh = this.Platform.height;
      const options = (HomeScreen._isAda) ? this.Platform.layout.homePreTitleAda : this.Platform.layout.homePreTitle;
      const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
      this._preTitle.x = dimensions.left !== null && dimensions.width !== null ? dimensions.left + dimensions.width * 0.5 : 0;
      this._preTitle.y = dimensions.top === null ? 0 : dimensions.top;
    }

    if (this._title) {
      const vw = this.Platform.width;
      const vh = this.Platform.height;
      const options = (HomeScreen._isAda) ? this.Platform.layout.homeTitleAda : this.Platform.layout.homeTitle;
      const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
      this._title.x = dimensions.left !== null && dimensions.width !== null ? dimensions.left + dimensions.width * 0.5 : 0;
      this._title.y = dimensions.top === null ? 0 : dimensions.top;
    }

    if (this._menuContainer) {
      this._menuContainer.scale.set(scale, scale);
      this._menuContainer.position.set((1 - scale) * 0.5 * this.Platform.width, (1 - scale) * 0.5 * this.Platform.height);
    }

    if (this._buttonAda) {
      this._buttonAda.strokeFrontBackground = (HomeScreen._isAda) ? 0xff197af1 : 0xffffffff;
      this._buttonAda.iconColor = (HomeScreen._isAda) ? 0xffffffff : 0xff197af1;
    }
  }

  private waitAndShowAttractor() {
    
    var self = this ;
    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout(() => {
      this.showAttractor();
    }, self.idleState.delayHome * 1000);
  }

  private stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
  }

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor());
  }

  private startPourTap() {
    const pourArgs = new PourEventArgs(this._buttonTapPourable, [], this.objectId);
    this.publishStartPourEvent(pourArgs);
  }

  private startPourSparkling() {
    const pourArgs = new PourEventArgs(this._buttonSparkingPourable, [], this.objectId);
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
    PublishEvent.Create(PubSubTopic.stopPour, this.objectId)
      .Send();
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

  // private createTestLayout(vw: number, vh: number) {
  //   const self = this;
  //   const buttons: any[] = [];

  //   // build items for test
  //   const layoutItems: any[] = [];
  //   _.forEach(this.appInfo.ConfigurationData.pourables.brands, function(pourable: PourableDesign) {
  //     // const brandButton = new BrandBlobButton(pourable, self.appInfo);
  //     const box = new Box(PixiColors.Yellow, 40, 24);
  //     console.log('box', box);
  //     buttons.push(box);
  //   });


  //   // let's use our layout
  //   const layoutMethod = WrapLayoutMethod.Create()
  //     .EnableItemsToGrowToFit()
  //     .WithAFixedItemSizeOf(24, 40);

  //   const layoutContainer = LayoutContainer
  //     .Create(this)
  //     .WithTheseVisualObjects(buttons)
  //     .ApplyThisLayoutMethodForSizingAndPositioning(layoutMethod)
  //     .PositionAtXY(200, 100)
  //     .WithHeightAndWidthOf(200, 500)
  //     .AndSetDebugTo(true)
  //     .FinishByAddingToParent();

  //   this._homeLayoutContainer = layoutContainer;
  // }
}
