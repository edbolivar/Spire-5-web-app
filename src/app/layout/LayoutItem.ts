import { JsUtil } from '../universal/JsUtil';
import { Sprite } from 'pixi.js';


export class LayoutItem {
    objectId: number;
    _visible = true;
    parent: any;
    height = 0;
    width = 0;
    visual: Sprite ;

    constructor(visual: Sprite) {
        this.objectId = JsUtil.getObjectId();
        this.visual = visual;
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        if  (this.visual) {
            this.visual.visible = value;
        }
        this._visible = value;
    }
}
