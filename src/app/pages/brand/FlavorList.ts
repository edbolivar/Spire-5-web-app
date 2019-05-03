import * as _ from 'lodash';
import Sprite = PIXI.Sprite;
import Text = PIXI.Text;
import FlavorListItem from './FlavorListItem';
import TextUtils from '../../utils/TextUtils';
import SimpleSignal from 'simplesignal';
import {AppInfoService} from '../../services/app-info.service';
import {FlavorDesign, FlavorDesignVisual, PourItem, Home} from '../../universal/app.types';
import HomeScreen from '../home/HomeScreen';

export default class FlavorList extends Sprite {

  private static readonly BLOCK_MAX_FLAVORS = true; // If true, user cannot select more than a given number of flavors; if false, they auto-deselect and select in a queue

  private _flavorIds: string[];
  private _maxSelectedFlavors: number;
  private _selectedFlavorIds: string[];
  selectedFlavors: FlavorDesign[] = [] ;
  private _title: Text;
  private _flavorItems: FlavorListItem[];

  private _onChanged = new SimpleSignal<(selectedFlavorIds: string[]) => void>();

  private _appInfo: AppInfoService;
  private _flavors: FlavorDesign[] = [];

  constructor(flavorIds: string[], maxSelectedFlavors: number, appInfo: AppInfoService) {
    super();

    this._appInfo = appInfo;
    this._flavors = appInfo.ConfigurationData.pourables.flavors;
    this._flavorIds = flavorIds;
    this._maxSelectedFlavors = Math.min(maxSelectedFlavors, flavorIds.length);
    this._selectedFlavorIds = [];
  }

  public get onChanged() {
    return this._onChanged;
  }

  public prepare(): Promise<void> {
    return new Promise((resolve) => {

      this._title = new Text(`TRY UP TO ${this._maxSelectedFlavors} FLAVORS`, TextUtils.getStyleBody(42, 0xc3c3cf));
      this._title.x = FlavorListItem.HEIGHT * 1.4;
      if(!HomeScreen._isAda) {
        this._title.y = 0;
      } else {
        this._title.y = 100;
      }
      this.addChild(this._title);

      const listItemPromises: Array<Promise<void>> = [];

      this._flavorItems = [];
      let px = 0;
      let py = this._title.y + this._title.height * 1.8;

      // Add by the order of the inventory list
      if(!HomeScreen._isAda) {

        this._flavors.forEach((flavor) => {
          const flavorGoodForPourable = _.find(this._flavorIds, function (id) {
            return flavor.id === id;
          });

          if (flavorGoodForPourable) {
            const flavorItem = new FlavorListItem(flavor, this._appInfo);
            flavorItem.x = px;
            flavorItem.y = py;
            flavorItem.onChanged.add(this.onItemChanged.bind(this));
            this.addChild(flavorItem);

            py += flavorItem.height;

            this._flavorItems.push(flavorItem);
            listItemPromises.push(flavorItem.prepare());
          }
        });
      } else {
        this._flavors.forEach((flavor) => {
          const flavorGoodForPourable = _.find(this._flavorIds, function (id) {
            return flavor.id === id;
          });

          if (flavorGoodForPourable) {
            const flavorItem = new FlavorListItem(flavor, this._appInfo);
            flavorItem.x = px;
            flavorItem.y = py;
            flavorItem.onChanged.add(this.onItemChanged.bind(this));
            this.addChild(flavorItem);
            if(px > this._appInfo.ConfigurationData.platform.width)
            {
              py += flavorItem.height;
              px =0;
            } else {
              px = px + this._appInfo.ConfigurationData.platform.width/2;
            }
            
            this._flavorItems.push(flavorItem);
            listItemPromises.push(flavorItem.prepare());
          }
        });
      }

      Promise.all(listItemPromises).then(() => {
        resolve();
      });
    });
  }

  public destroy() {
    this._title.destroy();
    this._flavorItems.forEach((flavorItems) => {
      flavorItems.destroy();
    });
    super.destroy();
  }

  private onItemChanged(flavor: FlavorDesign, isSelected: boolean) {

    if (isSelected) {
      // Add
      if (!this._selectedFlavorIds.includes(flavor.id)) {
        this._selectedFlavorIds.push(flavor.id);
      }

      if (!this.selectedFlavors.includes(flavor)) {
        this.selectedFlavors.push(flavor);
      }
    } else {
      // Remove
      this._selectedFlavorIds = this._selectedFlavorIds.filter((id) => id !== flavor.id);
      this.selectedFlavors = this.selectedFlavors.filter((item) => item !== flavor);
    }

    if (FlavorList.BLOCK_MAX_FLAVORS) {
      // Check whether an item should be disabled or not
      const canSelectMore = this._selectedFlavorIds.length === this._maxSelectedFlavors;
      this._flavorItems.forEach((flavorItem) => {
        if (!flavorItem.isSelected) {
          flavorItem.isDisabled = canSelectMore;
        }
      });
      this._onChanged.dispatch(this._selectedFlavorIds);
    } else {
      // Deselect the oldest item selected
      if (this._selectedFlavorIds.length > this._maxSelectedFlavors) {
        const oldestFlavorId = this._selectedFlavorIds[this._maxSelectedFlavors - 1];
        const oldestFlavorItem = this._flavorItems.find((flavorItem) => {
          return flavorItem.flavorId === oldestFlavorId;
        });
        if (oldestFlavorItem)
          oldestFlavorItem.isSelected = false;
      } else {
        this._onChanged.dispatch(this._selectedFlavorIds);
      }
    }
  }
}
