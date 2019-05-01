import { Point } from 'pixi.js';
import { distance, interpolate } from './PointUtils';

export class AbstractCurve {

  // A base/abstract class for curves, useless by itself

  // Properties
  public p1: Point;
  public p2: Point;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(__p1: Point, __p2: Point) {
    this.p1 = __p1;
    this.p2 = __p2;
  }

  // ================================================================================================================
  // PUBLIC functions -----------------------------------------------------------------------------------------------

  public getPointOnCurve(__t: number): Point {
    return interpolate(this.p2, this.p1, __t);
  }

  public decompose(__maximumErrorDistanceAllowed: number = 1, __maximumSegments: number = 100): Point[] {
    // Decomposes a curve into line segments, given a maximum allowed error distance
    const points: Point[] = [];

    // Create items until the error drift is always smaller than the maximum allowed
    let segments: number = 1; // Start with 1, which is quite possible if the curve is very straight
    let maxError: number = NaN;
    let currentError: number;
    let pCurve: Point;
    let pSegment: Point;
    
    while ((isNaN(maxError) || maxError > __maximumErrorDistanceAllowed) && segments < __maximumSegments) {
      maxError = 0;

      // Create all segments
      for (let n = 0; n < segments + 1; n++) {
        points[n] = new Point(0, 0);
      }

      points[0] = this.p1;
      for (let i = 1; i < segments; i++) {
        points[i] = this.getPointOnCurve(i / segments);
      }
      points[segments] = this.p2;

      // Verify error distance by checking the middle of every segment
      for (let i = 0; i < points.length - 1; i++) {
        pSegment = interpolate(points[i], points[i + 1], 0.5);
        pCurve = this.getPointOnCurve((i + 0.5) / segments);
        currentError = distance(pSegment, pCurve);
        if (currentError > maxError) {
          maxError = currentError;
          if (maxError > __maximumErrorDistanceAllowed) {
            // Off the maximum error distance already, no need to check further
            break;
          }
        }
      }

      segments++;
    }

    // Additional check to see if any of the other segments is removable
    // This is not strictly necessary but can happen for some curves
    for (let i = 0; i < points.length - 2; i++) {
      pSegment = interpolate(points[i], points[i + 2], 0.5);
      pCurve = this.getPointOnCurve((i + 1) / segments);
      currentError = distance(pSegment, pCurve);
      if (currentError < __maximumErrorDistanceAllowed) {
        // Can remove this point too
        points.splice(i + 1, 1);
        i--;
      }
    }

    return points;
  }

  // ================================================================================================================
  // ACCESSOR functions ---------------------------------------------------------------------------------------------

  public get length(): number {
    return distance(this.p1, this.p2);
  }
}
