import { JsUtil } from '../universal/JsUtil';
import { LayoutItem } from './LayoutItem';
import * as _ from 'lodash';
import LayoutAsSprite from './LayoutAsSprite';
import { AppInfoService } from '../services/app-info.service';
import { ILayoutMethod } from './WrapLayoutMethod';
import Easing from '../../transitions/Easing';
import {map} from 'moremath';

export class LayoutContainer {
    objectId: number;
    _visible = true;
    _parent: any;
    height = 0;
    width = 0;
    _children: LayoutItem[] = [];
    _showContainerBackground = true ;
    _layoutMethod: ILayoutMethod;
    _visibility: number;

    isDebug = false ;
    x = 0;
    y = 0;
    _backgroundColor: number;
    _layoutAsSprite: LayoutAsSprite;


    constructor() {
        this.objectId = JsUtil.getObjectId();
//        this._visibility = 1;
    }

    static Create(parentVisual: any): LayoutContainer {
        const layoutContainer = new LayoutContainer();  
        layoutContainer._parent = parentVisual; 

        return layoutContainer ;
    }

    public redraw() {
        
        this.calculatePosition();
     
        this.redrawVisibility();
    }

    private redrawVisibility() {

        // Calculate position ranges so we can do an animation based on location, top to bottom
        let minY = NaN;
        let maxY = NaN;
        this._children.forEach((button) => {
            if (isNaN(minY) || button.y < minY) { minY = button.y; }
            if (isNaN(maxY) || button.y > maxY) { maxY = button.y; }
        });

        const numButtons = this._children.length;
        const animDuration = 0.5;
 
        for (let i = 0; i < numButtons; i++) {
            const button = this._children[i];
            const fy = map(button.y, minY, maxY);
            const f = fy;
            const animStart = f * (1 - animDuration);
            const displayPhase = map(this._visibility, animStart, animStart + animDuration, 0, 1, true);
            const alpha = displayPhase;
            const scale = map(Easing.quintOut(displayPhase), 0, 1, 0, 1);

            // console.log("Start:"+animStart+ " " + "End:" + displayPhase + " " + fy + " " + "Visibility:",this._visibility);
           
            button.alpha = alpha;
            button.internalScale = scale;
        }
    }

    WithTheseVisualObjects(items: any[]): LayoutContainer    {
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
        this._layoutAsSprite.alpha = 1;
        this._layoutAsSprite.x = this.x;
        this._layoutAsSprite.y = this.y;
        return this._layoutAsSprite;
    }

    public logDiagnostic() {
        console.log(`iwidth=${this.intrinsicWidth}, ${this.width}, ${this._layoutAsSprite.width}`);
        console.log(`iheight=${this.intrinsicHeight}, ${this.height}, ${this._layoutAsSprite.height}`);

        _.forEach(this._children, function(layoutItem: LayoutItem) {
            if (layoutItem.visual) {
                console.log(`item.iwidth=${layoutItem._intrinsicWidth}, ${layoutItem.width}, ${layoutItem.visual.width}`);
                console.log(`item.iheight=${layoutItem._intrinsicHeight}, ${layoutItem.height}, ${layoutItem.visual.height}`); 
            } else {
                console.log('no visual');
            }
        });

    }

    private resetChildren() {
        // destroy the children
       console.log('layoutContainer.resetChildren');
        // _.forEach(this._children, function(layoutItem: LayoutItem) {
        //     if (layoutItem.visual && layoutItem.visual.destroy) {
        //         layoutItem.visual.destroy();
        //     }
        // });
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

    public get intrinsicWidth(): number {        
        return this._layoutMethod.intrinsicWidth;
    }

    public get intrinsicHeight(): number {
        return this._layoutMethod.intrinsicHeight;
    }

    public get visibility() {
        return this._visibility;
    }

    public set visibility(visibility:  number) {
        if (this._visibility !== visibility ) {
            this._visibility = visibility;
            this.redrawVisibility();
        }   
    }

    destroy() {
        console.log('destroy.layoutContainer');
        // this.resetChildren();
        this._layoutAsSprite.destroy();
    }
}
