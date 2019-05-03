import { JsUtil } from '../universal/JsUtil';
import { LayoutContainer } from './LayoutContainer';
import { LayoutItem } from './LayoutItem';
import * as _ from 'lodash';
import { ILayoutMethod } from './WrapLayoutMethod';

export class ADALayoutMethod implements ILayoutMethod {
    objectId: number;
    itemHeight: number;
    itemWidth: number;
    spaceBetween = 10;
    growItemsToFit = false ;

    _intrinsicWidth:number = 100;
    _intrinsicHeight:number = 100;
    _topOffset = 0;
    _leftOffset = 0;


   coordinates: CoordinateItem[] = 
    [
        { 'x': 0, 'y': 550, 'radius': 50 },
        { 'x': 140, 'y': 575, 'radius': 75 },
        { 'x': 390, 'y': 530, 'radius': 40 },
        { 'x': 290, 'y': 575, 'radius': 60 },
        { 'x': 0, 'y': 675, 'radius': 60 },
        { 'x': 120,  'y': 725, 'radius': 50 },
        { 'x': 250, 'y': 700, 'radius': 60 },
        { 'x': 375, 'y': 675,  'radius': 55 }
    ];

    constructor() {
        this.objectId = JsUtil.getObjectId();
    }

    static Create(): ADALayoutMethod {
        const layoutMethod = new ADALayoutMethod();
        return layoutMethod ;
    }

    UseTheseCoordinates(coordinates: CoordinateItem[] ): ADALayoutMethod {
        this.coordinates = coordinates;

        this._leftOffset = this.coordinates.reduce((prev, curr) => {
            return Math.min(curr.x - curr.radius, prev);
        }, Number.MAX_VALUE);
       
        if (this._leftOffset < 0) {
            this._leftOffset = 0;
        }

        this._topOffset = this.coordinates.reduce((prev, curr) => {
            return Math.min(curr.y - curr.radius, prev);
        }, Number.MAX_VALUE);

        // this._topOffset = 0;
        // this._leftOffset = 0;

        // Find the full area
        this._intrinsicWidth = this.coordinates.reduce((prev, curr) => {
            return Math.max(curr.x + curr.radius, prev);
        }, 0);// - this._leftOffset;

        this._intrinsicHeight = this.coordinates.reduce((prev, curr) => {
            return Math.max(curr.y + curr.radius, prev);
        }, 0);// - this._topOffset;

        return this;
    }

    WithAFixedItemSizeOf(height: number, width: number): ADALayoutMethod {
        this.itemHeight = height;
        this.itemWidth = width;
        return this;
    }
    
    EnableItemsToGrowToFit(): ADALayoutMethod {
        this.growItemsToFit = true ;
        return this;
    }
    
    public calculate(layoutContainer: LayoutContainer)  : void {
        const self = this;
    
        // Find the offset of all object's rectangle        
  
        layoutContainer._children.forEach((button, index) => {
            if (index >= this.coordinates.length) {
            button.visible = false;
            } else {
            const px = this.coordinates[index].x - this._leftOffset;
            const py = this.coordinates[index].y - this._topOffset;
    
            button.visible = true;
            button.x = px;
            button.y = py;
           
            button.radius = this.coordinates[index].radius ;

            // console.log(`button x=${button.x}, y=${button.y}, button.radius=${button.radius}`);

            }
        });        
  
        
    }

    get intrinsicWidth():number {
        return this._intrinsicWidth;
    }

    get intrinsicHeight():number {
        return this._intrinsicHeight;
    }

   
}

export class CoordinateItem {
    x = 0;
    y = 0;
    radius = 0;
}
