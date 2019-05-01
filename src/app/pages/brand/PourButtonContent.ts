import { Sprite, Text, Texture } from 'pixi.js';
import TextUtils from '../../utils/TextUtils';

export default class PourButtonContent extends Sprite {
  private _title: Text;
  private _icon: Sprite;

  constructor(arrowOffset: number) {
    super();

    this._title = new Text(
      'POUR',
      TextUtils.getStyleBody(64, 0xFFFFFF)
    );
    this._title.style.letterSpacing = -3;

    this._title.anchor.set(0.5, 0.5);
    this._title.position.set(0, -20);
    this.addChild(this._title);

    const iconTexture = Texture.fromImage('assets/ui/arrow-pour.png');
    this._icon = new Sprite(iconTexture);
    this._icon.anchor.set(0.5, 0.5);
    this._icon.scale.set(0.25, 0.25);
    this._icon.position.set(0, arrowOffset);
    this.addChild(this._icon);
  }
}
