  import Sprite = PIXI.Sprite;
  import {JsUtil} from '../../universal/JsUtil';
  import TextUtils from '../../utils/TextUtils';
  import {Text} from 'pixi.js';
  import {LocalizationService} from '../../services/localization.service';

  export default class OutOfStockOverlay extends Sprite {
    objectId: number;
    private _transparency: number;
    private _radius: number;
    public _title: Text;
    public _preTitle: Text;
    private _container: Sprite;
    private _overlayCircle: PIXI.Graphics;

    private OUT_OF_STOCK_KEY = 'Brand.unavailable';
    private OUT_OF_STOCK_SUBTITLE_KEY = 'Brand.unavailable.subtitle';

    constructor(radius: number) {
      super();
      this.objectId = JsUtil.getObjectId();
      console.log('Creating OutOfStockOverlay...');
      console.log('Current radius: ', radius);

      this._transparency = .5;
      this._radius = radius * .92;

      this._container = new Sprite();
      this.addChild(this._container);

      const preTitleSize = this._radius * 0.2;
      const titleSize = preTitleSize / 2;

      this._preTitle = new Text(
        LocalizationService.LocalizeString(this.OUT_OF_STOCK_KEY),
        TextUtils.getStyleBody(preTitleSize, 0xffffff)
      );

      this._title = new Text(
        '\n\n\n' + LocalizationService.LocalizeString(this.OUT_OF_STOCK_SUBTITLE_KEY),
        TextUtils.getStyleBody(titleSize, 0xffffff)
      );

      LocalizationService.instance.registerPixiTextObject(this.OUT_OF_STOCK_KEY, this._preTitle, this.objectId);
      LocalizationService.instance.registerPixiTextObject(this.OUT_OF_STOCK_SUBTITLE_KEY, this._title, this.objectId);

      this._preTitle.anchor.set(0.5, 0.5);
      this._preTitle.y = -this._radius * 0.3;
      this._title.anchor.set(0.5, 0.5);

      this._overlayCircle = new PIXI.Graphics();
      this._overlayCircle.beginFill(0xf808080, this._transparency);
      this._overlayCircle.drawCircle(0, 0, this._radius);
      this._overlayCircle.endFill();
      this._container.addChild(this._overlayCircle);

      this._container.addChild(this._title);
      this._container.addChild(this._preTitle);
    }

    public destroy() {
      LocalizationService.instance.unregisterPixiTextObjectsByConsumer(this.objectId);
      super.destroy();
    }
  }
