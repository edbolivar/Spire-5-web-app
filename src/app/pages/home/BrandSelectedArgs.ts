import { PourableDesign } from '../../universal/app.types';
import { Point } from 'pixi.js';

export interface BrandSelectedArgs {
  beverage: PourableDesign;
  startPosition: Point;
  startRotation: number;
  startRadius: number;
  rotationSpeed: number;
}
