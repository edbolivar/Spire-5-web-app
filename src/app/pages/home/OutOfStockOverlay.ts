import Sprite = PIXI.Sprite;
import {JsUtil} from '../../universal/JsUtil';
import TextUtils from '../../utils/TextUtils';
import {Text} from 'pixi.js';
import {LocalizationService} from '../../services/localization.service';
import { Color } from '../../data/types/Color';

export default class OutOfStockOverlay extends Sprite {
  objectId: number;

  private _text1: Text;
  private _text2: Text;
  private _subtitle: Text;
  
  private OUT_OF_STOCK_KEY1 = 'Brand.unavailable1';
  private OUT_OF_STOCK_KEY2 = 'Brand.unavailable2';
  private OUT_OF_STOCK_SUBTITLE_KEY = 'Brand.unavailable.subtitle';

  constructor(titleColor: Color, subtitleColor: Color) {
    super();
    this.objectId = JsUtil.getObjectId();
    
    this._text1 = new Text(
      LocalizationService.LocalizeString(this.OUT_OF_STOCK_KEY1),
      TextUtils.getStyleBody(28, titleColor.toRRGGBB())
    );

    this._text2 = new Text(
      LocalizationService.LocalizeString(this.OUT_OF_STOCK_KEY2),
      TextUtils.getStyleBody(50, titleColor.toRRGGBB())
    );

    this._subtitle = new Text(
      LocalizationService.LocalizeString(this.OUT_OF_STOCK_SUBTITLE_KEY),
      TextUtils.getStyleBody(16, subtitleColor.toRRGGBB())
    );

    this._text1.alpha = titleColor.a;
    this._text2.alpha = titleColor.a;
    this._subtitle.alpha = subtitleColor.a;

    LocalizationService.instance.registerPixiTextObject(this.OUT_OF_STOCK_KEY1, this._text1, this.objectId);
    LocalizationService.instance.registerPixiTextObject(this.OUT_OF_STOCK_KEY2, this._text2, this.objectId);
    LocalizationService.instance.registerPixiTextObject(this.OUT_OF_STOCK_SUBTITLE_KEY, this._subtitle, this.objectId);

    this._text1.anchor.set(0.5, 0.5);
    this._text2.anchor.set(0.5, 0.5);
    this._subtitle.anchor.set(0.5, 0.5);

    this.addChild(this._text1);
    this.addChild(this._text2);
    this.addChild(this._subtitle);

    this._text1.y = -45;
    this._text2.y = -10;
    this._subtitle.y = 40;
  }

  public set textColor(color: Color) {
    if (this._text1 != null) {
      this._text1.style.fill = color.toString();
    }

    if (this._text2 != null) {
      this._text2.style.fill = color.toString();
    }
  }

  public set subtitleColor(color: Color) {
    if (this._subtitle != null) {
      this._subtitle.style.fill = color.toString();
    }
  }

  public destroy() {
    LocalizationService.instance.unregisterPixiTextObjectsByConsumer(this.objectId);
    super.destroy();
  }
}
