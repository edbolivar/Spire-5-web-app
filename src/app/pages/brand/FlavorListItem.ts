import Sprite = PIXI.Sprite;
import Box from '../../display/shapes/Box';
import LegacyAnimatedSprite from '../../display/components/LegacyAnimatedSprite';
import Pill from '../../display/shapes/Pill';
import Fween from '../../../transitions/fween/Fween';
import Easing from '../../../transitions/Easing';
import Config from '../../data/Config';
import TextUtils from '../../utils/TextUtils';
import ColorUtils from '../../utils/ColorUtils';
import {map} from 'moremath';
import SimpleSignal from 'simplesignal';
import {Text} from 'pixi.js';
import {AppInfoService} from '../../services/app-info.service';
import {FlavorDesign} from '../../universal/app.types';
import HomeScreen from '../home/HomeScreen';

export default class FlavorListItem extends Sprite {

  public static readonly HEIGHT = 100;

  private __width: number;
  private __height: number;

  private _alphaDisabled: number;
  private _isSelected: boolean;
  private _isDisabled: boolean;
  private _selectedPhase: number;
  private _disabledPhase: number;
  private _colorText: number;
  private _colorTextSelected: number;

  private _onChanged = new SimpleSignal<(flavorId: string, isSelected: boolean) => void>();

  private _label: Text;
  private _boundingBox: Box;
  private _animation: LegacyAnimatedSprite;
  private _background: Pill;

  private _appInfo: AppInfoService;
  private  _flavors: FlavorDesign[] = [];
  private _flavor: FlavorDesign;

  constructor(flavor: FlavorDesign, appInfo: AppInfoService) {
    super();

    this._flavor = flavor;
    this._appInfo = appInfo;
    this._flavors = appInfo.ConfigurationData.flavors;

    this._isSelected = false;
    this._isDisabled = false;
    this._disabledPhase = 0;
    this._selectedPhase = 0;
    this.__height = FlavorListItem.HEIGHT;
    this.__width = 100;
  }

  public get flavorId() {
    return this._flavor.id;
  }

  public get onChanged() {
    return this._onChanged;
  }

  public get width() {
    return this.__width;
  }

  public set width(width: number) {
  }

  public get height() {
    return this.__height;
  }
  public set height(height: number) {
  }

  public get isDisabled() {
    return this._isDisabled;
  }

  public set isDisabled(isDisabled: boolean) {
    if (this._isDisabled !== isDisabled) {
      this._isDisabled = isDisabled;
      if (this._isDisabled) {
        Fween.use(this).to({disabledPhase: 1}, 0.6, Easing.quadOut).play();
      } else {
        Fween.use(this).to({disabledPhase: 0}, 0.3, Easing.quadOut).play();
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
        Fween.use(this).to({selectedPhase: 1}, 0.6, Easing.quadOut).play();
      } else {
        Fween.use(this).to({selectedPhase: 0}, 0.3, Easing.quadOut).play();
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

  public prepare(): Promise<void> {
    return new Promise((resolve, reject) => {

      this._colorText = this._flavor.design.textColor;
      this._colorTextSelected = this._flavor.design.textSelectedColor;
      this._alphaDisabled = this._flavor.design.alphaDisabled;

      this._boundingBox = new Box(0xff00ff, this.__width, this.__height);
      this._boundingBox.alpha = 0;
      this._boundingBox.interactive = true;
      this._boundingBox.buttonMode = true;
      this._boundingBox.on('click', this.toggleSelected.bind(this));
      this.addChild(this._boundingBox);

      this._background = new Pill(this._flavor.design.backgroundColor, this.__width, Math.round(this.__height * 0.92));
      this._background.x = 0;
      this._background.y = Math.round(this.__height / 2 - this._background.height / 2);
      this.addChild(this._background);

      if(!HomeScreen._isAda) { 
        this._label = new Text(this._flavor.name.toUpperCase(), TextUtils.getStyleBody(76, 0xffffff));
      } else {
        this._label = new Text(this._flavor.name.toUpperCase(), TextUtils.getStyleBody(50, 0xffffff));
      }
      this._label.anchor.set(0, 0.5);
      this._label.x = this.__height * 1.4;
      this._label.y = this.__height * 0.5;
      console.log(this._label.width);
      this.addChild(this._label);

      this._animation = new LegacyAnimatedSprite(this._flavor.select.asset, this._flavor.select.width, this._flavor.select.height, this._flavor.select.frames, this._flavor.select.fps, this._flavor.select.scale);
      this._animation.loop = false;
      this._animation.x = this.__height * 0.75;
      this._animation.y = this.__height * 0.5;
      this.addChild(this._animation);

      this.__width = this._label.x + this._label.width + this.__height * 0.5;

      this.redrawSelectedPhase();
      this.redrawDisabledPhase();
      this.redrawWidth();

      resolve();
    });
  }

  public destroy() {
    this._label.destroy();
    this._boundingBox.destroy();
    this._animation.destroy();
    this._background.destroy();
    this._onChanged.removeAll();
    super.destroy();
  }

  private toggleSelected() {
    this.isSelected = !this.isSelected;
  }

  private redrawSelectedPhase() {
    this._label.tint = ColorUtils.mapColor(this._selectedPhase, this._colorText, this._colorTextSelected);
    this._background.alpha = this._selectedPhase;
    this._background.width = map(Easing.quadInOut(this._selectedPhase), 0, 1, this._background.height, this.__width);
  }

  private redrawDisabledPhase() {
    this._boundingBox.interactive = this._boundingBox.buttonMode = this._disabledPhase === 0;
    this.alpha = map(this._disabledPhase, 0, 1, 1, this._alphaDisabled);
  }

  private redrawWidth() {
    this._background.width = this.__width;
    this._boundingBox.width = this.__width;
  }
}
