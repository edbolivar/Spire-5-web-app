import * as _ from "lodash";
import { Sprite, Text } from "pixi.js";
import FlavorListItem from "./FlavorListItem";
import TextUtils from "../../utils/TextUtils";
import SimpleSignal from "simplesignal";
import { AppInfoService } from "../../services/app-info.service";
import { FlavorDesign, DeviceInfo } from "../../universal/app.types";
import Easing from "../../../transitions/Easing";
import { LocalizationService } from "../../services/localization.service";

export type FlavorListArgs = (selectedFlavorIds: string[]) => void;

export default class FlavorList extends Sprite {
  private static readonly BLOCK_MAX_FLAVORS = true; // If true, user cannot select more than a given number of flavors; if false, they auto-deselect and select in a queue

  public _flavors: FlavorDesign[] = [];
  public selectedFlavors: FlavorDesign[] = [];

  private _appInfo: AppInfoService;
  private _availableHeight: number;
  private _availableWidth: number;
  private _flavorIds: string[];
  private _flavorItems: FlavorListItem[];
  private _maxSelectedFlavors: number;
  private _onChanged = new SimpleSignal<FlavorListArgs>();
  private _preTitle: Text;
  private _selectedFlavorIds: string[];
  private _title: Text;
  private _visibility: number;

  constructor(
    flavorIds: string[],
    maxSelectedFlavors: number,
    appInfo: AppInfoService,
    availableWidth: number,
    availableHeight: number
  ) {
    super();

    this._appInfo = appInfo;
    this._availableHeight = availableHeight;
    this._availableWidth = availableWidth;

    this._flavorIds = flavorIds;
    
    const brandConfig = this._appInfo.isAda ? this._appInfo.ConfigurationData.platform.brandConfigAda : this._appInfo.ConfigurationData.platform.brandConfig;


    this._flavors = this._flavorIds
      .map(flavorId =>
        appInfo.ConfigurationData.pourables.flavors.find(
          flavorDesign => flavorDesign.id === flavorId
        )
      );
    if (brandConfig.flavorMaxVisibleCount > 0) {
      this._flavors = this._flavors.filter(flavor => flavor !== undefined);
      this._flavors = this._flavors.slice(0, brandConfig.flavorMaxVisibleCount);
    }

    this._maxSelectedFlavors = Math.min(maxSelectedFlavors, flavorIds.length);
    this._selectedFlavorIds = [];
  }

  public get onChanged() {
    return this._onChanged;
  }

  public get visibility() {
    return this._visibility;
  }

  public set visibility(visibility: number) {
    if (this._visibility !== visibility) {
      this._visibility = visibility;
      this.redrawVisibility();
    }
  }

  private redrawVisibility() {
    this.alpha = Easing.quadIn(this.visibility);
  }

  public async prepare() {
    const config = this._appInfo.isAda
      ? this._appInfo.ConfigurationData.platform.brandConfigAda
      : this._appInfo.ConfigurationData.platform.brandConfig;

    const {
      flavorColumns,
      flavorColumnSpacing,
      flavorItemHeight,
      flavorIconSize,
      flavorTitleAreaHeight,
      flavorTitleFontSize,
      flavorTitleOffsetX
    } = config;

    const itemWidth = this._availableWidth / flavorColumns;

    let titleText = LocalizationService.LocalizeString(
      "brand.flavor.title"
    ).replace("${flavors}", this._maxSelectedFlavors.toString());

    let preTitle = LocalizationService.LocalizeString(
      "calories.flavors"
    ).replace("${calories}", "0");

    if (this._maxSelectedFlavors.valueOf() === 0) {
      titleText = "";
      preTitle = "";
    }

    this._title = new Text(
      titleText,
      TextUtils.getStyleBody(flavorTitleFontSize, 0xc3c3cf)
    );
    this._title.style.letterSpacing = -2;
    this._title.style.padding = 10;

    this._preTitle = new Text(
      preTitle,
      TextUtils.getStyleBody(flavorTitleFontSize * 0.83, 0xc3c3cf)
    );

    this._title.x = flavorTitleOffsetX;
    this._title.y = 0;

    this._preTitle.x = this._title.x;
    this._preTitle.y = this._title.height;

    if (DeviceInfo.unitState.UnitLocation === "CA") {
      this._preTitle.visible = false;
    }

    const listItemPromises: Array<Promise<void>> = [];

    this._flavorItems = [];

    const pourableFlavors = this._flavors.filter(flavor =>
      this._flavorIds.find(flavorId => flavor && flavor.id === flavorId)
    );

    pourableFlavors.forEach((flavor, idx) => {
      const column = idx % flavorColumns;
      const row = Math.floor(idx / flavorColumns);

      const flavorItem = new FlavorListItem(
        flavor,
        this._appInfo,
        itemWidth,
        flavorItemHeight,
        flavorIconSize
      );

      flavorItem.x = column * (flavorColumnSpacing + itemWidth);
      flavorItem.y = row * flavorItemHeight + flavorTitleAreaHeight;
      flavorItem.onChanged.add(this.onItemChanged.bind(this));

      this.addChild(flavorItem);

      this._flavorItems.push(flavorItem);
      listItemPromises.push(flavorItem.prepare());

      if (this._appInfo.isAda) {
        this._appInfo.adaNavigationService.appendButton(flavorItem);
      }
    });

    await Promise.all(listItemPromises);

    if (this._flavorItems.length === 0) {
      this._title.visible = false;
    } else if (this._flavorItems.length === 1) {
      this._title.text = this._title.text.replace("3", "1");
    } else if (this._flavorItems.length === 2) {
      this._title.text = this._title.text.replace("3", "2");
    }

    this.addChild(this._title);

    if (this._flavorItems.length !== 0) {
      this.addChild(this._preTitle);
    }
  }

  public destroy() {
    this._title.destroy();
    this._flavorItems.forEach(flavorItems => {
      flavorItems.destroy();
    });
    super.destroy();
  }

  private onItemChanged(flavor: FlavorDesign, isSelected: boolean) {
    if (isSelected) {
      // Add
      if (this._selectedFlavorIds.indexOf(flavor.id) === -1) {
        this._selectedFlavorIds.push(flavor.id);
      }

      if (this.selectedFlavors.indexOf(flavor) === -1) {
        this.selectedFlavors.push(flavor);
      }
    } else {
      // Remove
      this._selectedFlavorIds = this._selectedFlavorIds.filter(
        id => id !== flavor.id
      );
      this.selectedFlavors = this.selectedFlavors.filter(
        item => item !== flavor
      );
    }

    if (FlavorList.BLOCK_MAX_FLAVORS) {
      // Check whether an item should be disabled or not
      const canSelectMore =
        this._selectedFlavorIds.length === this._maxSelectedFlavors;
      this._flavorItems.forEach(flavorItem => {
        if (!flavorItem.isSelected) {
          flavorItem.isDisabled = canSelectMore;
        }
      });
      this._onChanged.dispatch(this._selectedFlavorIds);
    } else {
      // Deselect the oldest item selected
      if (this._selectedFlavorIds.length > this._maxSelectedFlavors) {
        const oldestFlavorId = this._selectedFlavorIds[
          this._maxSelectedFlavors - 1
        ];
        const oldestFlavorItem = this._flavorItems.find(flavorItem => {
          return flavorItem.flavorId === oldestFlavorId;
        });
        if (oldestFlavorItem) {
          oldestFlavorItem.isSelected = false;
        }
      } else {
        this._onChanged.dispatch(this._selectedFlavorIds);
      }
    }
  }
}
