import {Graphics, Point} from 'pixi.js';

export default class Box extends Graphics {

  private _color: number;
  private _scale: Point;

  constructor(color: number = 0xff00ff, width: number = 100, height: number = 100) {
    super();

    this.cacheAsBitmap = true;

    this._scale = new Point(1, 1);
    this._color = (color >>> 0) & 0xffffff;

    this.redrawRectangle();
    this.width = width;
    this.height = height;
  }

  public get color() {
    return this._color;
  }

  public set color(color: number) {
    this._color = color;
    this.redrawRectangle();
  }

  public get width() {
    return this._scale.x * 100;
  }

  public set width(width: number) {
    this.scale.x = width / 100;
  }

  public get height() {
    return this._scale.y * 100;
  }

  public set height(height: number) {
    this.scale.y = height / 100;
  }

  public destroy() {
    super.destroy();
  }

  private redrawRectangle() {
    this.clear();
    this.beginFill(this._color);
    this.drawRect(0, 0, 100, 100);
    this.endFill();

    this.redrawScale();
  }

  private redrawScale() {
    this.scale = this._scale;
  }
}
