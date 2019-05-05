import { Point, PointLike } from 'pixi.js';

export function polar(len: number, angle: number): Point {
  return new Point(
    len * Math.cos(angle),
    len * Math.sin(angle)
  );
}

export function distance(point1: Point, point2: Point): number {
  return Math.hypot(point2.x - point1.x, point2.y - point1.y);
}

export function originDistance(point: Point) {
  return distance(new Point(0, 0), point);
}

export function addPoints(point1: PointLike, point2: PointLike): Point {
  return new Point(
    point1.x + point2.x,
    point1.y + point2.y
  );
}
