
import Sprite = PIXI.Sprite;
import Text = PIXI.Text;
import TextUtils from '../../utils/TextUtils';
import { CalorieCup } from '../../universal/app.types';
import {LocalizationService} from '../../services/localization.service';
import { AppInfoService } from '../../services/app-info.service';

export default class CalorieInfoItem extends Sprite {

    private _line1Label: Text;
    private _line2Label: Text ;

    private __width: number;
    private __height: number;

    public get width() {
        return this.__width;
    }

    public set width(width: number) {
    }

    public get height() {
        return this.__height;
    }

    public set height(width: number) {
    }

    constructor(private _cup: CalorieCup){
        super();
        this.__width = 0;
        this.__height = 0;
    }

    public prepare(): Promise<void>{
        let self = this ;
        return new Promise((resolve) => {

            const calorieLocalization = LocalizationService.LocalizeString('calories.label');
            let line1Label = self._cup.Line1Label;
            line1Label = line1Label.replace('${calorie}', calorieLocalization);
            this._line1Label = new Text(line1Label, TextUtils.getStyleBody(24,AppInfoService.instance.isAda ? 0x798989 : 0xffffff, 'bold', 'right'));

            self.addChild(this._line1Label);

            this._line2Label = new Text(self._cup.Line2Label, TextUtils.getStyleBody(24, AppInfoService.instance.isAda ? 0x798989 : 0xffffff, 'bold', 'right'));
            this._line2Label.y = this._line1Label.y + this._line1Label.height;
            self.addChild(this._line2Label);

            // it's going to be the wider of the two labels
            self.__width = self._line1Label.width > self._line2Label.width ? self._line1Label.width: self._line2Label.width;
            self.__height = self._line1Label.height + self._line2Label.height;

            // add in enough to x to get everything right justified
            if (this._line1Label.width < this.__width) {
                this._line1Label.x = this._line1Label.x + (this.__width - this._line1Label.width);
            }

            // add in enough to x to get everything right justified
            if (this._line2Label.width < this.__width) {
                this._line2Label.x = this._line2Label.x + (this.__width - this._line2Label.width);
            }

            resolve();
        });
    }

    public destroy() {
        this._line1Label.destroy();
        this._line2Label.destroy();
        super.destroy();
    }
}
