import { Transition } from './Transition';
import { Platform, PourableDesign } from '../../universal/app.types';
import LayoutUtils from '../../utils/LayoutUtils';
import StringUtils from '../../utils/StringUtils';
import { Point } from 'pixi.js';

export class SelectBrandTransition implements Transition {
  type: string;

  beverage: PourableDesign;
  dimensions: any;
  radius: any;
  randomSeed: any;
  startRotation: number;
  startPosition: Point;
  startRadius: number;
  rotationSpeed: number;

  focusedPosition: Point;

  constructor(platform: Platform, beverage: PourableDesign, rotationSpeed: number, startRotation: number, startPosition: Point, startRadius: number) {
    this.type = 'SelectBrand';

    const vw = platform.width;
    const vh = platform.height;

    this.beverage = beverage;
    this.rotationSpeed = rotationSpeed;
    this.startRotation = startRotation;
    this.startPosition = startPosition;
    this.startRadius = startRadius;
    
    const options = platform.layout.brandBubble;
    this.dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this.randomSeed = StringUtils.quickNumericHash(beverage.id);
        
    this.radius = (this.dimensions.width + this.dimensions.height) / 4;
    this.focusedPosition = new Point(
      this.dimensions.left + this.dimensions.width / 2,
      this.dimensions.top + this.dimensions.height / 2
    );

    console.log('Transition: SelectBrand', this);
  }
}
