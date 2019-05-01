import { Point } from 'pixi.js';
import { map } from 'moremath';
import { ParticleCreatorFactory } from './ParticleCreatorFactory';
import { QuadraticBezierCurve } from '../../../utils/QuadraticBezierCurve';
import RandomGenerator from '../../../utils/RandomGenerator';
import Easing from '../../../../transitions/Easing';
import { polar, interpolate } from '../../../utils/PointUtils';

export class ParticleCreatorFactoryCircle implements ParticleCreatorFactory {

  // A circle that can spawn new particles from its top perimeter

  // Properties
  private center: Point;
  private radius: number;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(__center: Point, __radius: number) {
    this.center = __center;
    this.radius = __radius;
  }


  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  createParticlePath(): QuadraticBezierCurve {
    // Find min and max starting angle (within the screen)

    const screenWidth = 1080; // todo make this configurable

    const leftY: number = Math.sqrt(this.radius * this.radius - this.center.x * this.center.x);
    const leftAngle: number = Math.atan2(0 - leftY, 0 - this.center.x);

    const rw: number = screenWidth - this.center.x;
    const rightY: number = Math.sqrt(this.radius * this.radius - rw * rw);
    const rightAngle: number = Math.atan2(0 - rightY, rw);

    const f: number = RandomGenerator.getBoolean() ? Easing.quadInOut(Math.random()) : Easing.quadOut(Math.random());
    const angle: number = map(f, 0, 1, leftAngle, rightAngle);

    // Finally, find the position
    const p: Point = polar(this.radius * 1, angle);
    p.x += this.center.x;
    p.y += this.center.y;

    const maxHeight: number = f < 0.5 ? RandomGenerator.getInRange(200, 300) : RandomGenerator.getInRange(500, 600);

    // Decide on top point (towards the center)
    const pTop: Point = new Point(p.x + (screenWidth * 0.5 - p.x) * 0.25 + RandomGenerator.getInRange(-10, 10), p.y - maxHeight);
    
    // Decide on control point
    const pControl: Point = interpolate(p, pTop, 0.6);
    pControl.x += (pTop.x - pControl.x) * 0.8;

    // Create curve
    return new QuadraticBezierCurve(p, pControl, pTop);
  }
}
