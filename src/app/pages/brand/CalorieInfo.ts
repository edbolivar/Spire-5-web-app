import { Sprite, Text } from 'pixi.js';
import { LayoutRectangle } from '../../utils/LayoutUtils';
import TextUtils from '../../utils/TextUtils';
import { PourableDesign } from '../../universal/app.types';
import CalorieInfoItem from './CalorieInfoItem';
import { LocalizationService } from '../../services/localization.service';

export default class CalorieInfo extends Sprite {
  private _beverageName: string;
  private _title: Text;
  private _calorieInfoItems: CalorieInfoItem[];
  private _layoutRectangle: LayoutRectangle;
  private __width: number;
  private __height: number;

  constructor(
    private _beverage: PourableDesign,
    layoutRectangle: LayoutRectangle
  ) {
    super();

    this._beverageName = this._beverage.name;
    this._layoutRectangle = layoutRectangle;
    this.__width = 0;
    this.__height = 0;
  }

  public prepare(): Promise<void> {
    return new Promise(resolve => {
      const countryCode =
        LocalizationService.instance.localizationModel.primaryLocalization
          .CountryLanguageCode;

      if (countryCode !== 'en-us') {
        this._title = new Text(
          this._beverageName,
          TextUtils.getStyleBody(24, 0xffffff, 'bold', 'right')
        );
      } else {
        this._title = new Text(
          '',
          TextUtils.getStyleBody(24, 0xffffff, 'bold', 'right')
        );
      }

      this.__width = this._title.width;
      this.__height = this._title.height;

      const listItemPromises: Array<Promise<void>> = [];
      this._calorieInfoItems = [];

      this.y = this._layoutRectangle.bottom - 200;

      const px = 0;
      const titlePy = this._title.y + this._title.height;
      let py = titlePy;

      if (this._beverage.CalorieCups.length > 0) {
        this.addChild(this._title);
      }

      this._beverage.CalorieCups.forEach((cup) => {
        const calorieInfoItem = new CalorieInfoItem(cup);
        calorieInfoItem.x = px;
        calorieInfoItem.y = py + titlePy;

        this.addChild(calorieInfoItem);

        py += titlePy * 3;

        this._calorieInfoItems.push(calorieInfoItem);
        listItemPromises.push(calorieInfoItem.prepare());

        if (this.__width < calorieInfoItem.width) {
          this.__width = calorieInfoItem.width;
        }
      });

      this.__height = py;

      this.x = this._layoutRectangle.right - this.__width - 25;
      this.y = this._layoutRectangle.bottom - this.__height - 50;

      this._title.x = this.__width - this._title.width;

      this._calorieInfoItems.forEach(nutritionFactItem => {
        nutritionFactItem.x = this.__width - nutritionFactItem.width;
      });

      Promise.all(listItemPromises).then(() => {
        resolve();
      });
    });
  }

  public destroy() {
    this._title.destroy();
    this._calorieInfoItems.forEach(nutritionFact => {
      nutritionFact.destroy();
    });
    super.destroy();
  }
}
