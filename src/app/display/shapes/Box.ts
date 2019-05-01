import {Graphics, PointLike} from 'pixi.js';

export default class Box extends Graphics {

  private _color: number;

  constructor(color: number = 0xff00ff, width: number = 100, height: number = 100) {
    super();

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

  public get actualScale() {
    return this.toGlobal({ x: 1, y: 0 } as PointLike).x - this.toGlobal({ x: 0, y: 0 } as PointLike).x;
  }

  public get actualWidth() {
    return this.actualScale * 100;
  }

  public get width() {
    return this.scale.x * 100;
  }

  public set width(width: number) {
    this.scale.x = width / 100;
  }

  public get height() {
    return this.scale.y * 100;
  }

  public set height(height: number) {
    this.scale.y = height / 100;
  }

  public destroy() {
    super.destroy();
  }

  public redrawRectangle() {
    this.clear();
    this.beginFill(this._color);
    this.drawRect(0, 0, 100, 100);
    this.endFill();
  }
}
