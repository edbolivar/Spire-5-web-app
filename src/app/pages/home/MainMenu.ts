import Sprite = PIXI.Sprite;
import Box from '../../display/shapes/Box';
import BrandBlobButton from './BrandBlobButton';
import ParticleLayer from './ParticleLayer';
import SimpleSignal from 'simplesignal';
import {AppInfoService} from '../../services/app-info.service';
import {Platform, PourableDesign, DesignParticleParentItem, DesignOpacity} from '../../universal/app.types';
import * as _ from 'lodash';
import { LayoutContainer } from '../../layout/LayoutContainer';
import { ADALayoutMethod, CoordinateItem } from '../../layout/ADALayoutMethod';
import HomeScreen from './HomeScreen';

export default class MainMenu extends Sprite {

  private _visibility: number;
  private _intrinsicWidth: number;
  private _intrinsicHeight: number;

  private _hitArea: Box;
  private _buttons: BrandBlobButton[];

  private _onTappedBrand = new SimpleSignal<(brandId: string) => void>();

  private _appInfo: AppInfoService;
  private _platform: Platform;

  private _particleLayer: ParticleLayer;
  private _layoutContainer:  LayoutContainer;

  constructor(appInfo: AppInfoService) {
    super();
    const self = this;
    this._appInfo = appInfo;
    this._platform = appInfo.ConfigurationData.platform;

    // Properties
    this._visibility = 1;
    this._intrinsicWidth = 100;
    this._intrinsicHeight = 100;

    // Instances
    this._hitArea = new Box(0xffff00);
    this._hitArea.alpha = 0; // 0.5
    this.addChild(this._hitArea);

    this._buttons = [];
    const thingsThatPour: PourableDesign[] = this._appInfo.ConfigurationData.pourables.brands.concat(this._appInfo.ConfigurationData.pourables.curatedMixes);
    
     // ==========================================
      // ToDo: the MAX NUMBER OF BUTTONS coming in from platform.options, we can only HANDLE so many buttons
      // this gives a better set of options based on data
      // =========================================
    const hackedList: PourableDesign[] = [];
    const curatedCount = this._appInfo.ConfigurationData.pourables.curatedMixes.length;
    const wantThisManyBrands = 8 - curatedCount;
    for (let i = 0; i < wantThisManyBrands; i++) { 
      hackedList.push(thingsThatPour[i]);
    }
   
    for (let i = 0; i < curatedCount; i++) {
      hackedList.push(this._appInfo.ConfigurationData.pourables.curatedMixes[i]);
    }
    // ====================

    _.forEach(hackedList, function(beverage: PourableDesign) {
      const brandButton = new BrandBlobButton(beverage, self._appInfo);
      brandButton.onTapped.add(() => {
        self._onTappedBrand.dispatch(beverage.id);
      });
      // ==========================================*********************+++++++++++++++
      // ToDo: the MAX NUMBER OF BUTTONS coming in from platform.options, we can only HANDLE so many buttons
      // =======================================*********************+++++++++++++++++++
      self._buttons.push(brandButton);
    });

    // Create Particle Layer
    this.createParticleLayer();

    this.redraw(HomeScreen._isAda);
    
  }

  private createParticleLayer() {
    const options = this._platform.layout.homeMenu;
    const particleParentItems = options.items as DesignParticleParentItem[];
    for (let i = 0; i < this._buttons.length; i++) {
      particleParentItems[i].colors = this._buttons[i].pourable.design.particlesHome.colors;
      particleParentItems[i].designOpacity = new DesignOpacity();
      particleParentItems[i].designOpacity.from = this._buttons[i].pourable.design.particlesHome.opacity.from;
      particleParentItems[i].designOpacity.to = this._buttons[i].pourable.design.particlesHome.opacity.to;
      particleParentItems[i].particleCount = 4;
    }

    this._particleLayer = new ParticleLayer(particleParentItems);

    this.addChild(this._particleLayer);

  }

  public get onTappedBrand() {
    return this._onTappedBrand;
  }

  public get width() {
    return this.scale.x * this._intrinsicWidth ;
  }

  public set width(width: number) {
    this.scale.x = width / this._intrinsicWidth ;
  }

  public get height() {
    return this.scale.y * this._intrinsicHeight;
  }

  public set height(height: number) {
    this.scale.y = height / this._intrinsicHeight;
  }

  public get visibility() {
    return this._visibility;
  }

  public set visibility(visibility: number) {
    this._visibility = visibility;    
    if (this._layoutContainer.visibility !== visibility) {
      this._layoutContainer.visibility = visibility;
    }
  }

  public destroy() {

    this._buttons.forEach((button) => {
      console.log('MainMenu.DestroyButton', button.pourable.id);
      button.destroy();
    });
    
    this._buttons = [];
    this._hitArea.destroy();
    this._particleLayer.destroy();
    super.destroy();
  }

  public redraw(isAda: boolean) {

    const homeMenuConfig = this._platform.layout.homeMenu;
    const positions = (isAda) ? homeMenuConfig.adaItems as CoordinateItem[]
                               : homeMenuConfig.items as CoordinateItem[];

    this.applyLayout(positions);

    positions.forEach((item, index) => {    
      const px = positions[index].x;
      const py = positions[index].y;
      this._particleLayer.setParticleContainerPosition(index, px, py);
    });
    
  }

  private applyLayout(positions) {

    if (this._layoutContainer) {
      this._layoutContainer.destroy();
    }

    const layoutMethod = ADALayoutMethod.Create()
        .UseTheseCoordinates(positions);

    this._layoutContainer = LayoutContainer.Create(this)
        .WithTheseVisualObjects(this._buttons)
        .ApplyThisLayoutMethodForSizingAndPositioning(layoutMethod)
        .PositionAtXY(layoutMethod._leftOffset, layoutMethod._topOffset)
        .WithHeightAndWidthOf(layoutMethod._intrinsicHeight - layoutMethod._topOffset, layoutMethod._intrinsicWidth - layoutMethod._leftOffset)
        .AndSetDebugTo(true)
        .FinishByAddingToParent();

      this._intrinsicWidth = this._layoutContainer.intrinsicWidth;
      this._intrinsicHeight = this._layoutContainer.intrinsicHeight;

      this._layoutContainer.redraw();
      this._layoutContainer.logDiagnostic();
      // this._intrinsicWidth = _layoutContainer.intrinsicWidth;
  }

}
