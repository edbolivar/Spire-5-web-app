import { JsUtil } from '../universal/JsUtil';
import Sprite = PIXI.Sprite;
import BrandBlobButton from '../pages/home/BrandBlobButton';


export class LayoutItem {
    objectId: number;
    _visible = true;
    parent: any;
    _height = 0;
    _width = 0;
    _radius = 0;
    _x = 0;
    _y = 0;
    _alpha = 1;
    _internalScale = 1;
    _intrinsicHeight = 0;
    _intrinsicWidth = 0;
    
    visual: any ;

    constructor(visual: any) {
        this.objectId = JsUtil.getObjectId();
        this.visual = visual;
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        this._visible = value;
        if  (this.visual) {
            this.visual.visible = value;
        }
        
    }
    
    get height() {
        if  (this.visual) {
            this._height = this.visual.height;
        }
        return this._height;
    }

    set height(value) {
        this._height = value;
        if  (this.visual) {
            this.visual.height = value;
        }
        
    }

    get width() {
        if  (this.visual) {
            this._width = this.visual.width;
        }
        return this._width;
    }

    set width(value) {
        this._width = value;
        if  (this.visual) {
            this.visual.width = value;
        }
        
    }

    get x() {          
        return this._x;   
    }

    set x(value) {
        this._x = value ;
        if  (this.visual) {
            this.visual.x = value;
        }
    }

    get y() {    
        return this._y;        
    }

    set y(value) {
        this._y = value ;
        if  (this.visual) {
            this.visual.y = value;
        }
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(value) {
        this._alpha = value;
        if  (this.visual) {
            this.visual.alpha = value;
        }
    }

    get radius() {
        return this._radius;
    }

    set radius(value) {
        this._radius = value ;
        
        if  (this.visual) {
            this.visual.radius = value  ;
        }
    }

    get internalScale() {
        return this._internalScale;
    }

    set internalScale(value) {
        this._internalScale = value ;

        if  (this.visual) {
            this.visual.internalScale = value ;
        }
    }
}
