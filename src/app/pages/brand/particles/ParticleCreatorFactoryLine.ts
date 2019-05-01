import { Point } from 'pixi.js';
import { ParticleCreatorFactory } from './ParticleCreatorFactory';
import { QuadraticBezierCurve } from '../../../utils/QuadraticBezierCurve';
import Easing from '../../../../transitions/Easing';
import { interpolate } from '../../../utils/PointUtils';
import RandomGenerator from '../../../utils/RandomGenerator';

export class ParticleCreatorFactoryLine implements ParticleCreatorFactory {

  // A line segment that can spawn new particles

  // Properties
  private p0: Point;
  private p1: Point;
  private maxHeight: number;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(__p0: Point, __p1: Point, __maxHeight: number) {
    this.p0 = __p0;
    this.p1 = __p1;
    this.maxHeight = __maxHeight;
  }


  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  createParticlePath(): QuadraticBezierCurve {
    // Find min and max starting angle (within the screen)

    // Find position
    const f: number = Easing.quadInOut(Math.random());

    // Find starting point
    const p: Point = interpolate(this.p0, this.p1, 1 - f);

    const height: number = RandomGenerator.getInRange(0.8, 1) * this.maxHeight;

    // Find end point (highly biasedtowards the center)
    const screenWidth = 1080; // todo make configurable
    const pTop: Point = new Point(p.x + (screenWidth * RandomGenerator.getInRange(0.25, 0.5) - p.x) * 0.5 + RandomGenerator.getInRange(-10, 10), p.y - height);

    // Find control point
    const pControl: Point = interpolate(p, pTop, RandomGenerator.getInRange(0.6, 0.75));
    pControl.x += (pTop.x - pControl.x) * 0.8;

    // Create curve
    return new QuadraticBezierCurve(p, pControl, pTop);
  }
}
