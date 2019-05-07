import * as _ from 'lodash';
import Sprite = PIXI.Sprite;
import AnimatedSpriteController from '../../display/components/AnimatedSpriteController';
import SimpleSignal from 'simplesignal';
import {AppInfoService} from '../../services/app-info.service';
import {FlavorDesign, PourableDesign} from '../../universal/app.types';

export default class FlavorMix extends Sprite {

  public static readonly HEIGHT = 100;
  
  private _flavorIds: string[];
  private _flavorMixs: any[];

  private _onChanged = new SimpleSignal<(selectedFlavorIds: string[]) => void>();

  private _appInfo: AppInfoService;
  private _flavors: FlavorDesign[] = [];
  private _beverage: PourableDesign;

  private _brandIngredient: PourableDesign;
  private _flavorIngredients: FlavorDesign[];

  private _logo: Sprite;

  constructor(beverage: PourableDesign, appInfo: AppInfoService) {
    super();

    this._beverage = beverage;

    this._appInfo = appInfo;
    this._flavors = appInfo.ConfigurationData.flavors;

    // this._flavorIds = this._beverage.flavorShots;
    

    // once your here, you need to get the graphic for the brand
    // and the images for the flavors, you'll go get those 
    // from the appInfo.ConfigurationData using

    // this._beverage.pourItem.brandId to find the design/logo in configurationdata.brands
    // then._beverate.pourItem.flavorIds to find the design/logs in configurationdata.flavors
    // so using the above, you get this data,then you know whatlogo's to use
    // private _brandIngredient: PourableDesign;
    //  private _flavorIngredients: FlavorDesign[];
    
  }

  public get onChanged() {
    return this._onChanged;
  }

  public prepare(): Promise<void> {
    return new Promise((resolve) => {

      const listItemPromises: Array<Promise<void>> = [];

      this._flavorMixs = [];
      let px = 200;
      const py = 150;
      let noBrandId: boolean = true;
      const brandId =  this._beverage.pourItem.brandId;
      this._appInfo.ConfigurationData.pourables.brands.map((brand: PourableDesign) => {
        console.log('looking', brand.id);
        if (brand.id === brandId) {
          this._logo = Sprite.fromImage(brand.design.assets.logoBrand);
          noBrandId = false;
        }
      });

      if (noBrandId === true) {
        this._logo = Sprite.fromImage('');
      }
      
      this._beverage.design.assets.bfConnector = './assets/attractor/b_f_connector.png';
      this._logo.x = px;
      this._logo.y = py;
      this._logo.position.set(this._logo.x - this._logo.width * 0.5, this._logo.y - FlavorMix.HEIGHT * 0.5);
      this.addChild(this._logo);

      px += FlavorMix.HEIGHT * 2;
      this._flavorIds =  this._beverage.pourItem.flavorIds;
      this._flavors.forEach((flavor) => {
        const flavorGoodForPourable = _.find(this._flavorIds, function (id) {
          return flavor.id === id;
        });

        if (flavorGoodForPourable) {

          const bfconn = Sprite.fromImage(this._beverage.design.assets.bfConnector);
          bfconn.x = px;
          bfconn.y = py + 50;
          bfconn.position.set(bfconn.x - FlavorMix.HEIGHT * 0.5, bfconn.y - FlavorMix.HEIGHT * 0.5);
          this.addChild(bfconn);

          px += FlavorMix.HEIGHT;

          this._flavorMixs.push(bfconn);

          const flavorItem = new AnimatedSpriteController({
            id: flavor.id,
            image: flavor.select.asset,
            frameWidth: flavor.select.width,
            frameHeight: flavor.select.height,
            fps: flavor.select.fps,
            frames: flavor.select.frames,
            scale: flavor.select.scale,
            autoPlay: false
          });
          flavorItem.loop = false;
          flavorItem.originalX = px;
          flavorItem.originalY = py + 50;
          flavorItem.parent = this;

          px += FlavorMix.HEIGHT;
          this._flavorMixs.push(flavorItem);
        }
      });

      Promise.all(listItemPromises).then(() => {
        resolve();
      });
    });
  }

  public destroy() {
    this._flavorMixs.forEach((flavorItems) => {
      flavorItems.destroy();
    });
    this._logo.destroy();
    super.destroy();
  }

}
