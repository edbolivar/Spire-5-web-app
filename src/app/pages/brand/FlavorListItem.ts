import Sprite = PIXI.Sprite;
import Box from '../../display/shapes/Box';
import AnimatedSpriteController from '../../display/components/AnimatedSpriteController';
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
import {LocalizationService} from '../../services/localization.service';
import PillRing from '../../display/shapes/PillRing';


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
  private _animation: AnimatedSpriteController;
  private _background: Pill;
  private _isFocused: boolean = false;

  private _appInfo: AppInfoService;
  private  _flavors: FlavorDesign[] = [];
  private _flavor: FlavorDesign;
  private _adaStroke: PillRing;

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

      this._label = new Text(LocalizationService.LocalizeString(this._flavor.id), TextUtils.getStyleBody(76, 0xffffff));
      this._label.anchor.set(0, 0.5);
      this._label.x = this.__height * 1.4;
      this._label.y = this.__height * 0.5;
      this.addChild(this._label);

      this._animation = new AnimatedSpriteController({
        id: this._flavor.id,
        image: this._flavor.select.asset, 
        frameWidth: this._flavor.select.width, 
        frameHeight: this._flavor.select.height, 
        frames: this._flavor.select.frames, 
        fps: this._flavor.select.fps, 
        scale: this._flavor.select.scale,
        autoPlay: false
      });
      this._animation.loop = false;
      this._animation.originalX = this.__height * 0.75;
      this._animation.originalY = this.__height * 0.5;
      this._animation.parent = this;

      this.__width = this._label.x + this._label.width + this.__height * 0.5;

      this.addAdaStrokeBorder();

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
    this._adaStroke.destroy();

    super.destroy();
  }

  private toggleSelected() {
    this.isSelected = !this.isSelected;
  }
  get isFocused() {
    return this._isFocused;
  }

  set isFocused(value: boolean) {
    this._isFocused = value ;
    this._adaStroke.visible = value ;
  }
  private addAdaStrokeBorder() {
    const padding = 30;
    this._adaStroke = new PillRing(0x39c9bb, 0, Math.round(this.__height - padding), 5);
    this._adaStroke.x = Math.round(this.__width / 2 - Math.round(this.__width - padding) / 2);
    this._adaStroke.y = Math.round(this.__height / 2 - this._adaStroke.height / 2);
    this._adaStroke.alpha = 1;
    this._adaStroke.visible = false;
    this._adaStroke.width = Math.round(this.__width - padding);
    this.addChild(this._adaStroke);    
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
