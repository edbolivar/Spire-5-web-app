import AbstractScreen from '../../display/navigation/AbstractScreen';
import {AppInfoService} from '../../services/app-info.service';
import {Sprite, Text, Texture} from 'pixi.js';
import TextUtils from '../../utils/TextUtils';
import {ItemStateInfo, OutOfOrderEventArgs} from '../../universal/app.types';
import Fween from '../../../transitions/fween/Fween';
import AppRoutes from '../../display/navigation/AppRoutes';

export default class OutOfOrderScreen extends AbstractScreen {

  private _visibility: number;

  private _textVerticalMargin = 50;
  private _outOfOrderItemsVerticalMargin = 50;
  private _outOfOrderItemsHorizontalMargin = 25;

  private _bubblesTexture: Texture;
  private _bubblesSprite:  Sprite;

  private _iconTexture: Texture;
  private _iconSprite: Sprite;

  private _outOfOrderTitle: Text;
  private _outOfOrderBody: Text;

  private _outOfOrderItemsSprite: Sprite;
  private _outOfOrderItemsText: Text[] = [];
  private _outOfOrderItems: ItemStateInfo[] = [];

  private _bubbleImageAsset = 'assets/out_of_order/outOfOrderBubbles.png';
  private _errorIconImageAsset = 'assets/out_of_order/outOfOrderIcon.png';

  private _outOfOrderTitleText = 'WELL, THIS ISN\'T\r\nWORKING.';
  private _outOfOrderBodyText = 'IT\'S NOT YOU. IT\'S ME. DON\'T WORRY.\r\n I\'LL BE BACK VERY SOON.';

  constructor(appInfo: AppInfoService, outOfOrderEventArgs: OutOfOrderEventArgs) {
    super(appInfo);

    this.visibility = 0;
    console.log('outoforder', outOfOrderEventArgs );
    this._outOfOrderItems = outOfOrderEventArgs.Items;
  }

  public get visibility() {
    return this._visibility;
  }

  public set visibility(visibility: number) {
    if (this._visibility !== this.visibility) {
      this._visibility = visibility;
      this.redrawErrorIconVisibility();
      this.redrawBubblesVisibility();
    }
  }

  private redrawErrorIconVisibility() {
    this._iconSprite.x = (this.Platform.width - this._iconTexture.baseTexture.width) / 2.0;
    this._iconSprite.y = this.Platform.height / 4.0;

    this._outOfOrderTitle.x = (this.Platform.width - this._outOfOrderTitle.width) / 2.0;
    this._outOfOrderTitle.y = this._iconSprite.y - this._outOfOrderTitle.height - this._textVerticalMargin;

    this._outOfOrderBody.x = (this.Platform.width - this._outOfOrderBody.width) / 2.0;
    this._outOfOrderBody.y = this._iconSprite.y + this._iconSprite.height + this._textVerticalMargin;

    this._outOfOrderTitle.visible = true;
    this._outOfOrderBody.visible = true;
  }

  private redrawBubblesVisibility() {
    this._bubblesSprite.x = 0;
    this._bubblesSprite.y = this.Platform.height - this._bubblesTexture.baseTexture.height;
  }

  public prepare(): Promise<void> {
    return new Promise<void>((resolve) => {

      // Create background elements
      this.createBubbles();
      this.createErrorIcon();

      // Create all message text elements
      this.createOutOfOrderTitle();
      this.createOutOfOrderBody();

      // Create out of order items
      this.createOutOfOrderItemsList();

      // Initial settings
      this.visibility = 0;

      resolve();
    });
  }

  public show(previousRoute?: string): Promise<void> {
    return new Promise((resolve) => {
      this.alpha = 0;
      this.visibility = 1;
      this.redrawBubblesVisibility();
      this.redrawErrorIconVisibility();
      Fween
        .use(this)
        .to({alpha: 1}, 0.3)
        .call(() => {
          resolve();
        }).play();
    });
  }

  public hide(nextRoute?: string): Promise<void> {
    return new Promise((resolve) => {
      Fween
        .use(this)
        .to({alpha: 0}, 0.3)
        .call(resolve).play();
    });
  }

  private createBubbles() {
    this._bubblesTexture = Texture.fromImage(this._bubbleImageAsset);
    this._bubblesSprite = new Sprite(this._bubblesTexture);
    this.addChild(this._bubblesSprite);

    this._bubblesTexture.baseTexture.on('loaded', this.onBubblesTextureLoaded.bind(this));
  }

  private onBubblesTextureLoaded() {
    this.redrawBubblesVisibility();
  }

  private createErrorIcon() {
    this._iconTexture = Texture.fromImage(this._errorIconImageAsset);
    this._iconSprite = new Sprite(this._iconTexture);
    this._iconSprite.interactive = true;
    this._iconSprite.on('pointerdown', this.onErrorIconPointerDown.bind(this));
    this.addChild(this._iconSprite);

    this._iconTexture.baseTexture.on('loaded', this.onErrorIconTextureLoaded.bind(this));
  }

  private onErrorIconPointerDown() {
    this.navigator.goTo(AppRoutes.getHome());
  }

  private onErrorIconTextureLoaded() {
    this.redrawErrorIconVisibility();
  }

  private createOutOfOrderTitle() {
      this._outOfOrderTitle = new Text(this._outOfOrderTitleText, TextUtils.getStyleBody(76, 0x000000, 'normal', 'center'));
      this._outOfOrderTitle.visible = false;
      this.addChild(this._outOfOrderTitle);
  }

  private createOutOfOrderBody() {
    this._outOfOrderBody = new Text(this._outOfOrderBodyText, TextUtils.getStyleBody(30, 0x000000, 'normal', 'center'));
    this._outOfOrderBody.visible = false;
    this.addChild(this._outOfOrderBody);
  }

  private createOutOfOrderItemsList() {

    let top = 0;
    let maxWidth = 0;

    this._outOfOrderItemsSprite = new Sprite();

    this._outOfOrderItems.forEach((outOfOrderItem) => {
      const outOfOrderItemText = new Text(outOfOrderItem.Description, TextUtils.getStyleBody(16, 0xA9A9A9, 'normal', 'center'));
      outOfOrderItemText.y = top;
      top += outOfOrderItemText.height;

      if (outOfOrderItemText.width > maxWidth) {
        maxWidth = outOfOrderItemText.width;
      }

      this._outOfOrderItemsText.push(outOfOrderItemText);
      this._outOfOrderItemsSprite.addChild(outOfOrderItemText);
    });

    this._outOfOrderItemsSprite.x = this.Platform.width - maxWidth - this._outOfOrderItemsHorizontalMargin;
    this._outOfOrderItemsSprite.y = this._outOfOrderItemsVerticalMargin;
    this.addChild(this._outOfOrderItemsSprite);
  }

  public destroy() {
    this._bubblesTexture.destroy();
    this._bubblesSprite.destroy();

    this._iconTexture.destroy();
    this._iconSprite.destroy();

    this._outOfOrderBody.destroy();
    this._outOfOrderTitle.destroy();

    super.destroy();
  }
}
