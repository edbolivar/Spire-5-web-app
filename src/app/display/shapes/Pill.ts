import { Graphics } from "pixi.js";
import { map } from "moremath";

export default class Pill extends Graphics {
  private __width: number;
  private __height: number;
  private _color: number;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(
    color: number = 0xff00ff,
    width: number = 100,
    height: number = 100
  ) {
    super();

    this._color = color;

    this.redrawShape();
    this.__width = width;
    this.__height = height;
  }

  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  public get color() {
    return this._color;
  }

  public set color(color: number) {
    this._color = color;
    this.redrawShape();
  }

  public get width() {
    return this.__width;
  }

  public set width(width: number) {
    if (this.__width !== width) {
      this.__width = width;
      this.redrawShape();
    }
  }

  public get height() {
    return this.__height;
  }

  public set height(height: number) {
    if (this.__height !== height) {
      this.__height = height;
      this.redrawShape();
    }
  }

  public destroy() {
    super.destroy();
  }

  // ================================================================================================================
  // PRIVATE INTERFACE -----------------------------------------------------------------------------------------------

  private redrawShape() {
    const w = Math.max(this.__width, this.__height);
    const h = this.__height;
    const radius = Math.min(w, h) / 2;

    this.clear();
    this.beginFill(this._color);
    this.drawPolygon(this.generatePill(0, 0, w, h, radius));
    this.endFill();
  }

  private generatePill(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    // We generate the curves manually because drawRoundedRect() doesn't use actual round corners
    const points: number[] = [];
    this.generateCornerCurve(points, x + radius, y + radius, -radius, -radius);
    this.generateCornerCurve(
      points,
      x + width - radius,
      y + radius,
      radius,
      -radius,
      true
    );
    this.generateCornerCurve(
      points,
      x + width - radius,
      y + height - radius,
      radius,
      radius
    );
    this.generateCornerCurve(
      points,
      x + radius,
      y + height - radius,
      -radius,
      radius,
      true
    );
    return points;
  }

  private generateCornerCurve(
    points: number[],
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    reverse: boolean = false
  ) {
    const segments = 10;
    for (let i = 0; i <= segments; i++) {
      let angle = map(i, 0, segments, 0, Math.PI / 2);
      if (reverse) angle = Math.PI / 2 - angle;
      // X and Y
      points.push(x + Math.cos(angle) * radiusX);
      points.push(y + Math.sin(angle) * radiusY);
    }
  }
}
