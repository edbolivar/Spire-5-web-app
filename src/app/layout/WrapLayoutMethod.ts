import { JsUtil } from '../universal/JsUtil';
import { LayoutContainer } from './LayoutContainer';
import { LayoutItem } from './LayoutItem';
import * as _ from 'lodash';

export class WrapLayoutMethod implements ILayoutMethod {
    objectId: number;
    itemHeight: number;
    itemWidth: number;
    spaceBetween = 10;
    growItemsToFit = false ;

    constructor() {
        this.objectId = JsUtil.getObjectId();
    }

    static Create(): WrapLayoutMethod {
        const layoutMethod = new WrapLayoutMethod();    
        return layoutMethod ;
    }

    WithAFixedItemSizeOf(height: number, width: number): WrapLayoutMethod {
        this.itemHeight = height;
        this.itemWidth = width;
        return this;
    }
    
    EnableItemsToGrowToFit(): WrapLayoutMethod {
        this.growItemsToFit = true ;
        return this;
    }
    public calculate(layoutContainer: LayoutContainer): void {
        const self = this;
        let x = 0;
        let y = 0;

        _.forEach(layoutContainer._children, function(layoutItem: LayoutItem) {
            
            if ((x + 10 + self.itemWidth) > layoutContainer.width) {
                x = 0;
                y = y + 10 + self.itemHeight;
            }

            layoutItem.visual.x = x;
            layoutItem.visual.y = y;


            console.log('**widthXheight**', layoutItem.visual.width, layoutItem.visual.height);
            // layoutItem.displayObject.width = 1;
            // layoutItem.displayObject.height = 1;

            x = x + 10 + self.itemWidth;
            
        });
    }

   
}

export interface ILayoutMethod {
    calculate(layoutContainer: LayoutContainer);
}

