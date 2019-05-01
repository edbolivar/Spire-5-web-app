import Sprite = PIXI.Sprite;
import Box from "../../display/shapes/Box";
import AnimatedSpriteController from "../../display/components/AnimatedSpriteController";
import Pill from "../../display/shapes/Pill";
import Fween from "../../../transitions/fween/Fween";
import Easing from "../../../transitions/Easing";
import TextUtils from "../../utils/TextUtils";
import ColorUtils from "../../utils/ColorUtils";
import { map } from "moremath";
import SimpleSignal from "simplesignal";
import { Text } from "pixi.js";
import {
  FlavorDesign,
  DesignAnimation,
  DeviceInfo
} from "../../universal/app.types";
import { LocalizationService } from "../../services/localization.service";
import PillRing from "../../display/shapes/PillRing";
import { JsUtil } from "../../universal/JsUtil";
import { AppInfoService } from "../../services/app-info.service";

export type FlavorListItemArgs = (
  flavorId: string,
  isSelected: boolean
) => void;

export default class FlavorListItem extends Sprite {
  private _adaStroke: PillRing;
  private _alphaDisabled: number;
  private _animation: AnimatedSpriteController;
  private _appInfo: AppInfoService;
  private _availableWidth: number;
  private _availableHeight: number;
  private _background: Pill;
  private _boundingBox: Box;
  private _colorText: number;
  private _colorTextSelected: number;
  private _disabledPhase: number;
  private _flavor: FlavorDesign;
  private _iconSize: number;
  private _isDisabled: boolean;
  private _isFocused: boolean = false;
  private _isSelected: boolean;
  private _label: Text;
  private _onChanged = new SimpleSignal<FlavorListItemArgs>();
  private _selectedPhase: number;

  constructor(
    flavor: FlavorDesign,
    appInfo: AppInfoService,
    availableWidth: number,
    availableHeight: number,
    iconSize: number
  ) {
    super();

    this._appInfo = appInfo;
    this._availableHeight = availableHeight;
    this._availableWidth = availableWidth;
    this._disabledPhase = 0;
    this._flavor = flavor;
    this._iconSize = iconSize;
    this._isDisabled = false;
    this._isSelected = false;
    this._selectedPhase = 0;
  }

  public get flavorId() {
    return this._flavor.id;
  }

  public get onChanged() {
    return this._onChanged;
  }

  public get isDisabled() {
    return this._isDisabled;
  }

  public set isDisabled(isDisabled: boolean) {
    if (this._isDisabled !== isDisabled) {
      this._isDisabled = isDisabled;
      if (this._isDisabled) {
        Fween.use(this)
          .to({ disabledPhase: 1 }, 0.6, Easing.quadOut)
          .play();
      } else {
        Fween.use(this)
          .to({ disabledPhase: 0 }, 0.3, Easing.quadOut)
          .play();
      }
    }
  }

  public get disabledPhase() {
    return this._disabledPhase;
  }

  public set disabledPhase(disabledPhase: number) {
    if (this._disabledPhase !== disabledPhase) {
      this._disabledPhase = disabledPhase;
      this.redrawDisabledPhase();
    }
  }

  public get isSelected() {
    return this._isSelected;
  }

  public set isSelected(isSelected: boolean) {
    if (this._isSelected !== isSelected) {
      this._isSelected = isSelected;
      this._onChanged.dispatch(this._flavor, this._isSelected);
      this._animation.play();
      if (this._isSelected) {
        Fween.use(this)
          .to({ selectedPhase: 1 }, 0.6, Easing.quadOut)
          .play();
      } else {
        Fween.use(this)
          .to({ selectedPhase: 0 }, 0.3, Easing.quadOut)
          .play();
      }
    }
  }

  public get selectedPhase() {
    return this._selectedPhase;
  }

  public set selectedPhase(selectedPhase: number) {
    if (this._selectedPhase !== selectedPhase) {
      this._selectedPhase = selectedPhase;
      this.redrawSelectedPhase();
    }
  }

  public async prepare() {
    this._colorText = this._flavor.design.textColor;
    this._colorTextSelected = this._flavor.design.textSelectedColor;
    this._alphaDisabled = this._flavor.design.alphaDisabled;

    this._boundingBox = new Box(0xff00ff, this._availableWidth, this._availableHeight);
    this._boundingBox.alpha = 0;
    this._boundingBox.interactive = true;
    this._boundingBox.buttonMode = true;
    this._boundingBox.on("click", this.toggleSelected.bind(this));
    this.addChild(this._boundingBox);

    this._background = new Pill(
      this._flavor.design.backgroundColor,
      this._availableWidth,
      Math.round(this._availableHeight * 0.92)
    );
    this._background.x = 0;
    this._background.y = Math.round(
      this._availableHeight / 2 - this._background.height / 2
    );
    this.addChild(this._background);

    let labelString = LocalizationService.LocalizeString(this._flavor.id);
    if (DeviceInfo.unitState.UnitLocation === "CA") {
      labelString += " (0 Cals)";
    }

    const config = this._appInfo.isAda ? this._appInfo.ConfigurationData.platform.brandConfigAda : this._appInfo.ConfigurationData.platform.brandConfig;
    const { flavorItemFontSize, flavorItemLabelOffsetX } = config;

    this._label = new Text(labelString, TextUtils.getStyleBody(flavorItemFontSize, 0xffffff));
    this._label.style.letterSpacing = -1.5;
    this._label.style.padding = 10;
    this._label.anchor.set(0, 0.5);
    this._label.x = (this._iconSize / 2) + flavorItemLabelOffsetX;
    this._label.y = this._availableHeight * 0.5;
    this.addChild(this._label);

    const designAnimation: DesignAnimation = JsUtil.mapToNewObject(
      {
        id: this._flavor.id,
        image: this._flavor.select.asset,
        frameWidth: this._flavor.select.width,
        frameHeight: this._flavor.select.height,
        frames: this._flavor.select.frames,
        fps: this._flavor.select.fps * 0.6,
        scale: this._flavor.select.scale
      },
      new DesignAnimation()
    );

    this._animation = new AnimatedSpriteController(designAnimation);
    this._animation.loop = false;
    this._animation.originalX = this._availableHeight * 0.5;
    this._animation.originalY = this._availableHeight * 0.5;
    this._animation.parent = this;
    this._animation.width = this._iconSize;
    this._animation.height = this._iconSize;
    this._animation.play();

    this.addAdaStrokeBorder();

    this.redrawSelectedPhase();
    this.redrawDisabledPhase();
    this.redrawWidth();
  }

  public destroy() {
    if (this._label) {
      this._label.destroy();
      delete this._label;
    }

    if (this._boundingBox) {
      this._boundingBox.destroy();
      delete this._boundingBox;
    }

    if (this._animation) {
      this._animation.destroy();
      delete this._animation;
    }

    if (this._background) {
      this._background.destroy();
      delete this._background;
    }

    if (this._onChanged) {
      this._onChanged.removeAll();
      delete this._onChanged;
    }

    if (this._adaStroke) {
      this._adaStroke.destroy();
      delete this._adaStroke;
    }

    super.destroy();
  }

  private toggleSelected() {
    this.isSelected = !this.isSelected;
  }

  get isFocused() {
    return this._isFocused;
  }

  set isFocused(value: boolean) {
    this._isFocused = value;
    this._adaStroke.visible = value;
  }

  private addAdaStrokeBorder() {
    const padding = 30;
    this._adaStroke = new PillRing(
      0x39c9bb,
      0,
      Math.round(this._availableHeight - padding),
      5
    );
    this._adaStroke.x = Math.round(
      this._availableWidth / 2 - Math.round(this._availableWidth - padding) / 2
    );
    this._adaStroke.y = Math.round(
      this._availableHeight / 2 - this._adaStroke.height / 2
    );
    this._adaStroke.alpha = 1;
    this._adaStroke.visible = false;
    this._adaStroke.width = Math.round(this._availableWidth - padding);
    this.addChild(this._adaStroke);
  }

  private redrawSelectedPhase() {
    this._label.tint = ColorUtils.mapColor(
      this._selectedPhase,
      this._colorText,
      this._colorTextSelected
    );
    this._background.alpha = this._selectedPhase;
    this._background.width = map(
      Easing.quadInOut(this._selectedPhase),
      0,
      1,
      this._background.height,
      this.contentWidth
    );
  }

  private redrawDisabledPhase() {
    this._boundingBox.interactive = this._boundingBox.buttonMode =
      this._disabledPhase === 0;
    this.alpha = map(this._disabledPhase, 0, 1, 1, this._alphaDisabled);
  }

  private get contentWidth() {
    return this._label.x + this._label.width + (this._availableHeight * 0.2);
  }

  private redrawWidth() {
    if (this._background) {
      this._background.width = this.contentWidth;
    }

    if (this._boundingBox) {
      this._boundingBox.width = this.contentWidth;
    }
  }
}
