import * as _ from "lodash";
import { Sprite, Rectangle } from "pixi.js";
import AnimatedSpriteController from "../../display/components/AnimatedSpriteController";
import SimpleSignal from "simplesignal";
import { AppInfoService } from "../../services/app-info.service";
import { PourableDesign, DesignAnimation } from "../../universal/app.types";
import { JsUtil } from "../../universal/JsUtil";
import { createImageToFit } from "../../utils/LayoutUtils";
import { asyncForEach } from "../../utils/asyncForEach";
import Box from "../../display/shapes/Box";

export type SelectedFlavorArgs = (selectedFlavorIds: string[]) => void;

export default class FlavorMix extends Sprite {
  private _appInfo: AppInfoService;
  private _beverage: PourableDesign;
  private _destroyLater: any[] = [];
  private _logo: Sprite;
  private _onChanged = new SimpleSignal<SelectedFlavorArgs>();

  constructor(beverage: PourableDesign, appInfo: AppInfoService) {
    super();

    this._beverage = beverage;
    this._appInfo = appInfo;
  }

  public destroy() {
    if (this._destroyLater) {
      this._destroyLater.forEach(item => {
        item.destroy();
      });

      delete this._destroyLater;
    }

    if (this._logo) {
      this._logo.destroy();
      delete this._logo;
    }

    super.destroy();
  }

  public get onChanged() {
    return this._onChanged;
  }

  public async prepare() {
    const brandId = this._beverage.pourItem.brandId;
    const brand = this._appInfo.ConfigurationData.pourables.brands.find(
      b => b.id === brandId
    );

    const { flavorDirection } = this._appInfo.ConfigurationData.platform;
    const flavorMix = this._appInfo.isAda
      ? this._appInfo.ConfigurationData.platform.layout.flavorMixAda
      : this._appInfo.ConfigurationData.platform.layout.flavorMix;

    const flavorMixConfig = this._appInfo.isAda
      ? this._appInfo.ConfigurationData.platform.flavorMixConfigAda
      : this._appInfo.ConfigurationData.platform.flavorMixConfig;

    const horizontal = flavorDirection === "Horizontal" || this._appInfo.isAda;

    const mixFlavorIds = this._beverage.pourItem.flavorIds;

    const flavors = this._appInfo.ConfigurationData.flavors.filter(
      flavor => mixFlavorIds.indexOf(flavor.id) !== -1
    );

    if (!brand) {
      console.log(`Could not find brand '${brandId}' in FlavorMix`);
      return;
    }

    const {
      logoSize,
      logoMargin,
      plusImageSize,
      flavorImageSize,
      flavorImageMargin
    } = flavorMixConfig;

    const maxItemSize = Math.max(logoSize, plusImageSize, flavorImageSize);

    let totalWidth = 0;
    let totalHeight = 0;

    this._logo = await createImageToFit(
      new Rectangle(
        0,
        0,
        horizontal ? logoSize : maxItemSize,
        horizontal ? maxItemSize : logoSize
      ),
      brand.design.assets.logoBrand
    );
    this.addChild(this._logo);
    this._destroyLater.push(this._logo);

    if (horizontal) {
      totalWidth = logoSize + logoMargin;
      totalHeight = maxItemSize;
    } else {
      totalWidth = maxItemSize;
      totalHeight = logoSize + logoMargin;
    }

    await asyncForEach(flavors, async flavor => {
      const plusSignRect = new Rectangle(
        horizontal ? totalWidth : 0,
        horizontal ? 0 : totalHeight,
        horizontal ? plusImageSize : maxItemSize,
        horizontal ? maxItemSize : plusImageSize
      );

      const plusSignImage = await createImageToFit(
        plusSignRect,
        `./assets/ui/${flavor.id}.png`
      );
      this.addChild(plusSignImage);
      this._destroyLater.push(plusSignImage);

      if (horizontal) {
        totalWidth += plusImageSize;
      } else {
        totalHeight += plusImageSize;
      }

      const designAnimation: DesignAnimation = JsUtil.mapToNewObject(
        {
          id: flavor.id,
          image: flavor.select.asset,
          frameWidth: flavor.select.width,
          frameHeight: flavor.select.height,
          fps: flavor.select.fps * 0.75,
          frames: flavor.select.frames,
          scale: flavor.select.scale
        },
        new DesignAnimation()
      );

      const flavorItem = new AnimatedSpriteController(designAnimation);
      flavorItem.loop = false;
      flavorItem.parent = this;

      if (horizontal) {
        flavorItem.width = flavorImageSize;
        flavorItem.height = maxItemSize;
        flavorItem.originalX =
          totalWidth + flavorImageSize / 2 + flavorImageMargin;
        flavorItem.originalY = maxItemSize / 2;
      } else {
        flavorItem.width = maxItemSize;
        flavorItem.height = flavorImageSize;
        flavorItem.originalX = maxItemSize / 2;
        flavorItem.originalY =
          totalHeight + flavorImageSize / 2 + flavorImageMargin;
      }

      flavorItem.play();
      this._destroyLater.push(flavorItem);

      if (horizontal) {
        totalWidth += flavorImageSize + flavorImageMargin * 2;
      } else {
        totalHeight += flavorImageSize + flavorImageMargin * 2;
      }
    });

    if (horizontal) {
      const vw = this._appInfo.ConfigurationData.platform.width;
      this.position.set(vw / 2 - totalWidth / 2, flavorMix.y);
    } else {
      this.position.set(flavorMix.x, flavorMix.y);
    }
  }
}
