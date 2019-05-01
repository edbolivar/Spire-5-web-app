import { AbstractCurve } from './AbstractCurve';
import { Point } from 'pixi.js';

export class QuadraticBezierCurve extends AbstractCurve {

  // Properties
  public cp: Point;

  // Temp
  public nt: number;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(__p1: Point, __control: Point, __p2: Point) {
    super(__p1, __p2);

    this.cp = __control;
  }


  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  public getPointOnCurve(__t: number): Point {
    // http://en.wikipedia.org/wiki/B%C3%A9zier_curve
    this.nt = 2 * (1 - __t);

    return new Point(
      this.p1.x + __t * (this.nt * (this.cp.x - this.p1.x) + __t * (this.p2.x - this.p1.x)),
      this.p1.y + __t * (this.nt * (this.cp.y - this.p1.y) + __t * (this.p2.y - this.p1.y))
    );
  }
}
