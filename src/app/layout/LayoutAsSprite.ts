import { Sprite } from 'pixi.js';
import {map} from 'moremath';
import * as _ from 'lodash';
import { LayoutContainer } from './LayoutContainer';
import { LayoutItem } from './LayoutItem';
import { AppInfoService } from '../services/app-info.service';
import { Platform } from '../universal/app.types';
import TextUtils from '../utils/TextUtils';
import LayoutUtils, { LayoutRectangle } from '../utils/LayoutUtils';
import { PixiColors } from '../utils/PixiColors';
import ColorUtils from '../utils/ColorUtils';

export default class LayoutAsSprite extends Sprite {
  
  constructor(private appInfo: AppInfoService, private _layoutContainer: LayoutContainer) {
    super();
    const self = this;

    this.createDiagnosicBackground();

    // this.sampleText();

    this.addChildrenToLayout();
  }

  private sampleText() {
    const options =  this.appInfo.ConfigurationData.platform.layout.homeTitleAda ;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, 1080, 1920);
    const text = 'what is up?';
    const x = this.createText(dimensions, text, 52, 0xff0000);
  }

  private createDiagnosicBackground() {
    if (!this._layoutContainer.isDebug) {
        return ;
    }
    const graphics = new PIXI.Graphics();
    graphics.beginFill(PixiColors.Cyan);
       
    // draw a rectangle
    graphics.drawRect(0, 0, this._layoutContainer.width, this._layoutContainer.height);

    this.addChild(graphics);
  }

  private createText(dimensions: LayoutRectangle, caption: string, size: number, color: number) {
    const text = new PIXI.Text(caption, TextUtils.getStyleBody(size, color));
    
    this.addChild(text);
    return text;
  }

  public destroy() {  
    super.destroy();
  }

  public addChildrenToLayout() {
    const self = this;
    console.log('inside of redraw');
    _.forEach(this._layoutContainer._children, function(layoutItem: LayoutItem) {
        self.addChild(layoutItem.visual);
    });
  } 
}
