import { JsUtil } from '../universal/JsUtil';
import { LayoutItem } from './LayoutItem';
import * as _ from 'lodash';
import LayoutAsSprite from './LayoutAsSprite';
import { AppInfoService } from '../services/app-info.service';
import { ILayoutMethod } from './WrapLayoutMethod';

export class LayoutContainer {
    objectId: number;
    _visible = true;
    _parent: any;
    height = 0;
    width = 0;
    _children: LayoutItem[] = [];
    _showContainerBackground = true ;
    _layoutMethod: ILayoutMethod;

    isDebug = false ;
    x = 0;
    y = 0;
    _backgroundColor: number;
    _layoutAsSprite: LayoutAsSprite;

    constructor() {
        this.objectId = JsUtil.getObjectId();
    }

    static Create(parentDisplayObject: any): LayoutContainer {
        const layoutContainer = new LayoutContainer();  
        layoutContainer._parent = parentDisplayObject;
        return layoutContainer ;
    }

    WithTheseDisplayObjects(items: any[]): LayoutContainer {
        const self = this;
        this.resetChildren();
        _.forEach(items, function(displayObject) {
            self._children.push(new LayoutItem(displayObject));
        });
        return this;
    }

    PositionAtXY(x: number, y: number): LayoutContainer {
        this.x = x;
        this.y = y;
        return this;
    }

    ApplyThisLayoutMethodForSizingAndPositioning(layoutMethod: ILayoutMethod): LayoutContainer {
        this._layoutMethod = layoutMethod;
        return this;
    }

    WithHeightAndWidthOf(height: number, width: number): LayoutContainer {
        this.height = height;
        this.width = width ;
        return this;
    }

    AndSetDebugTo(enable: boolean): LayoutContainer {
        this.isDebug = enable;
        return this;
    }
    
    FinishByAddingToParent(): LayoutContainer {
        this._parent.addChild(this.getLayoutAsSprite());
        return this;
    }

    calculatePosition() {
        this._layoutMethod.calculate(this);  
    }
    
    getLayoutAsSprite(): LayoutAsSprite {
        this.calculatePosition();
        this._layoutAsSprite = new LayoutAsSprite(AppInfoService.instance, this);
        this._layoutAsSprite.x = this.x;
        this._layoutAsSprite.y = this.y;
        return this._layoutAsSprite;
    }

    private resetChildren() {
        // destroy the children
        _.forEach(this._children, function(layoutItem: LayoutItem) {
            if (layoutItem.visual && layoutItem.visual.destroy) {
                layoutItem.visual.destroy();
            }
        });
        this._children = [];
    }

    get showContainerBackground() {
        return this._showContainerBackground;
    }

    set showContainerBackground(value) {
        this._showContainerBackground = value ;
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        this._visible = value;
    }

    destroy() {
        console.log('destory.layoutContainer');
        this.resetChildren();
        this._layoutAsSprite.destroy();
    }
}
