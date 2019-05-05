import { Injectable } from '@angular/core';
import {AppInfoService} from './app-info.service';
import {JsUtil} from '../universal/JsUtil';
import {PublishEvent, PubSubTopic, SubscribeEvent} from '../universal/pub-sub-types';
import {
  ConfigurationData,
  LocalizedItems,
  ConsumerUILocalizationModel,
  PixiTextByResourceId, PixiLocalizationItem
} from '../universal/app.types';
import * as _ from 'lodash';

@Injectable()
export class LocalizationService {
  public static instance: LocalizationService;

  _pixiTextByResourceId: PixiTextByResourceId;
  objectId: number;
  localizationModel: ConsumerUILocalizationModel = new ConsumerUILocalizationModel();
  currentMapping: LocalizedItems = new LocalizedItems();
  gotData = false ;

  static LocalizeString(key: string) {
    if (LocalizationService.instance.currentMapping[key]) {
      return LocalizationService.instance.currentMapping[key];
    } else {
      if (LocalizationService.instance.gotData) {
       console.log('error - localization key not found', key);
      }
      return key ;
    }
  }

  static setCurrentPrimaryOrSecondary(primaryOrSecondary: string) {
    if (primaryOrSecondary === 'primary') {
      console.log('changing language to ', LocalizationService.instance.localizationModel.primaryLocalization.CountryLanguageCode);
      LocalizationService.instance.currentMapping = this.instance.localizationModel.primaryLocalization.ResourceStrings;
    }
    // in order to switch the secondary language has to have a language too
    if (primaryOrSecondary === 'secondary' && LocalizationService.instance.localizationModel.secondaryLocalization.getHasItems()) {
      console.log('changing language to ', LocalizationService.instance.localizationModel.secondaryLocalization.CountryLanguageCode);
      LocalizationService.instance.currentMapping = this.instance.localizationModel.secondaryLocalization.ResourceStrings;
    }
    LocalizationService.instance.localizePixiTextObjects();
    PublishEvent.Create(PubSubTopic.localizationChanged, LocalizationService.instance.objectId).Send();
  }

  constructor() {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.localizationService', this.objectId);
    LocalizationService.instance = this;
    this._pixiTextByResourceId = new PixiTextByResourceId();
    const self = this ;

    SubscribeEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
      .HandleEventWithThisMethod((e) => self.onDataReady(e.data))
      .Done();
  }

  onDataReady(e: ConfigurationData) {
    // console.log('localization service got data', e.localizedItems);
    this.localizationModel = e.localizedItems;
    this.currentMapping = e.localizedItems.primaryLocalization.ResourceStrings;

    this.localizePixiTextObjects();
    PublishEvent.Create(PubSubTopic.localizationChanged, this.objectId).Send();
  }

   registerPixiTextObject(resourceId: string, pixiText: PIXI.Text, objectIdOfConsumer: number) {
    // console.log('Registering the new object...');
    const newItem = new PixiLocalizationItem(resourceId, pixiText, objectIdOfConsumer);

    this._pixiTextByResourceId[resourceId] = newItem;
  }

  localizePixiTextObjects() {
    // iterate PixiTextByResourceId calling LocalizeString and assigning to text property

    // Q - when running onDataReady, we run this method.
    // are we trying to build a list of localization items based on all the objects in
    // the current mapping? or are all the objects already set at this point and we're just localizing them...

    // console.log('localizePixiTextObjects');

    _.forEach(this._pixiTextByResourceId, function(e, k, theArray) {
      theArray[k].pixiText.text = LocalizationService.LocalizeString(e.resourceId);
    });

    // console.log('completed pixiText', this._pixiTextByResourceId);
  }

  unregisterPixiTextObjectsByConsumer(objectIdOfConsumer: number) {
    // remove items that belong to this object id of the incoming consumer
    // in destroy of callers, add this call
    // we remove the property from this._pixiTextByResourceId

    // console.log('Deleting object related to objectId', objectIdOfConsumer);

    this._pixiTextByResourceId = _.omitBy(
      this._pixiTextByResourceId,
        e => e.objectIdOfConsumer === objectIdOfConsumer
    );

    // console.log('New PixiText', this._pixiTextByResourceId);
  }
}
