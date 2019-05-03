import Sprite = PIXI.Sprite;
import * as _ from 'lodash';
import { LayoutContainer } from './LayoutContainer';
import { LayoutItem } from './LayoutItem';
import { AppInfoService } from '../services/app-info.service';

import { PixiColors } from '../utils/PixiColors';
import HomeScreen from '../pages/home/HomeScreen';

export default class LayoutAsSprite extends Sprite {
  
  constructor(private appInfo: AppInfoService, private _layoutContainer: LayoutContainer) {
    super();
  
    this.createDiagnosicBackground();

    this.addChildrenToLayout();
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


  public destroy() {  
    super.destroy();
  }

  public addChildrenToLayout() {
    const self = this;    

    _.forEach(this._layoutContainer._children, function(layoutItem: LayoutItem) {
      if (layoutItem.visual) {
        console.log('LayoutAsSprite.addChild', layoutItem.visual);
        self.addChild(layoutItem.visual);
      }
    });
  } 
}
