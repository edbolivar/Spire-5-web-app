import { Injectable } from '@angular/core';
import {AppInfoService} from './app-info.service';
import {JsUtil} from '../universal/JsUtil';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';
import 'rxjs/add/observable/forkJoin';
import {catchError} from 'rxjs/operators';
import {PublishEvent, PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../universal/pub-sub-types';
import {
  ConfigurationData, DesignAnimation, DesignAssets, DesignColors, DesignNode, DesignParticles,
  FlavorDesign,
  FlavorDesignDetail,
  FlavorDesignVisual,
  IdleState, OutOfOrderEventArgs, PourableDesign,
  PourItem,
  PourItemModel, Home, CalorieCup, ConsumerUILocalizationModel, LocalizationResourceModel, Override, UnitState, DeviceInfo, DesignSecondaryAnimation, PlatformModel, PlatformMenuLayout, ItemStateInfo
} from '../universal/app.types';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import * as _ from 'lodash';

@Injectable()
export class ConfigurationService {
  objectId: number ;

  constructor(private appInfo: AppInfoService, private http: HttpClient) {
      this.objectId = JsUtil.getObjectId();
      console.log('ctor.ConfigurationService', this.objectId);
      this.loadConfigurationData();
      const self = this;

      SubscribeEvent.Create(PubSubTopic.resetApp, this.objectId)
        .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
           self.handleResetApp(e.data);
        }).Done();
  }

  handleResetApp(e: OutOfOrderEventArgs) {
    console.log('== got resetApp===', e);
    window.location.href = this.appInfo.origin;
  }

  loadConfigurationData() {
    const self = this ;

    // this enables many http requests launched at once and
    // waits until all requests are complete to continue
    const x = Observable.forkJoin(
      this.getPlatform(),
      this.getFlavors(),
      this.getPourables(),
      this.getIdleState(),
      this.getBubbles(),
      this.getAnimations(),
      this.getLocalization(),
      this.getHome(),
      this.getOverrides(),
      this.getUnitState() 
    )
    .subscribe(data => {
        const configurationData: ConfigurationData = new ConfigurationData();

        configurationData.platform = data[0];
        configurationData.flavors =  data[1];
        configurationData.pourables = data[2];
        configurationData.idleState = data[3]; 
        configurationData.bubbles = data[4];
        configurationData.animations = data[5];
        configurationData.localizedItems = data[6];
        configurationData.home = data[7];
        configurationData.overrides = data[8];
        DeviceInfo.unitState = data[9];
        
        if (! this.isValidConfiguration(configurationData)) {
          return ;
        }
        
        this.adjustPlatformForProperLayout(configurationData);

        PublishEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
          .SetDataArgumentTo(configurationData)
          .Send();

        PublishEvent.Create(PubSubTopic.idleStateChanged, this.objectId)
          .SetDataArgumentTo(configurationData.idleState)
          .Send();
    },  (err: HttpErrorResponse) => {
        console.log('ERROR in loadConfigurationData', err);
    });
  }

  private isValidConfiguration(configData: ConfigurationData): boolean {

    console.log(configData);

    configData.outOfOrderEventArgs = new OutOfOrderEventArgs();
    if (!configData.platform.layout) {
      const itemStateInfo = new ItemStateInfo();
      itemStateInfo.ItemType = 'SpireServer';
      itemStateInfo.Description = 'Spire Server is not available';
      configData.outOfOrderEventArgs.Items.push(itemStateInfo);
    } else  if (configData.pourables.pourMenu.length === 0 && configData.pourables.waters.length === 0) {
      // invalid inventory
      const itemStateInfo = new ItemStateInfo();
      itemStateInfo.ItemType = 'Inventory';
      itemStateInfo.Description = 'Invalid Inventory';
      configData.outOfOrderEventArgs.Items.push(itemStateInfo);
    } else if (DeviceInfo.unitState.UnitType === 'Spire5' && configData.pourables.pourMenu.length > 28) {
      const itemStateInfo = new ItemStateInfo();
      itemStateInfo.ItemType = 'Inventory';
      itemStateInfo.Description = `Invalid Inventory, Too Many Beverages,\n28 max, ${configData.pourables.pourMenu.length} current`;
      configData.outOfOrderEventArgs.Items.push(itemStateInfo);
    } else if (DeviceInfo.unitState.UnitType !== 'Spire5' && configData.pourables.pourMenu.length > 16) {
      const itemStateInfo = new ItemStateInfo();
      itemStateInfo.ItemType = 'Inventory';
      itemStateInfo.Description = `Invalid Inventory, Too Many Beverages,\n16 max, ${configData.pourables.pourMenu.length} current` ;
      configData.outOfOrderEventArgs.Items.push(itemStateInfo);
    }
    
    if (configData.outOfOrderEventArgs.Items.length > 0) {
      configData.isValidConfig = false ;
      
      PublishEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
      .SetDataArgumentTo(configData)
      .Send(); 
    }

    return configData.isValidConfig;
  }
  
  private adjustPlatformForProperLayout(configData: ConfigurationData) {
      if (!configData.pourables) {
        // invalid inventory
        return ; 
      }

      configData.platform.homeMenu = configData.pourables.homeMenu;
 
      if (DeviceInfo.unitState.UnitType === 'Spire5') {
        for (let i = 0; i < configData.pourables.brands.length; i++) {
          configData.pourables.brands[i].design.secondaryAnimation = configData.pourables.brands[i].design.secondaryAnimation_5;
          configData.pourables.brands[i].design.secondaryAnimationAda = configData.pourables.brands[i].design.secondaryAnimationAda_5;
        }
      }
    }

  private getAnimations(): Observable<DesignAnimation[]> {
    const url = this.appInfo.config.urls.animations;
    return this.http.get<DesignAnimation[]>(url)
      .map( itemArray => {
        const fixedUpArray: DesignAnimation[] = [];
        _.forEach(itemArray, function(item) {
          fixedUpArray.push(JsUtil.mapToNewObject(item, new DesignAnimation()));
        });
        return fixedUpArray ;
      } )
      .pipe(
        catchError(this.handleError('designAnimations', null))
      );
  }

  private getIdleState(): Observable<IdleState> {
    const url = this.appInfo.config.urls.idlestate;
    return this.http.get<IdleState>(url)
      .map( data => JsUtil.mapToNewObject(data, new IdleState()) )
      .pipe(
        catchError(this.handleError('idlestate', null))
      );
  }

  private getUnitState(): Observable<UnitState> {
    const url = this.appInfo.config.urls.unitstate;
    return this.http.get<UnitState>(url)
      .map( data => this.mapUnitState(data))
      .pipe(
        catchError(this.handleError('home', new Home()))
      );
  }
  
  private getHome(): Observable<Home> {
    const url = this.appInfo.config.urls.home;
    return this.http.get<Home>(url)
      .map( data =>  JsUtil.mapToNewObject(data, new Home()) )
      .pipe(
        catchError(this.handleError('home', new Home()))
      );
  }

  private getBubbles(): Observable<DesignAnimation> {
    const url = this.appInfo.config.urls.bubbles;
    return this.http.get<DesignAnimation>(url)
      .map( data => JsUtil.mapToNewObject(data, new DesignAnimation()) )
      .pipe(
        catchError(this.handleError('bubbles', null))
      );
  }

  private getLocalization(): Observable<ConsumerUILocalizationModel> {
    const self = this ;
    const url = this.appInfo.config.urls.localization;
    return this.http.get<ConsumerUILocalizationModel>(url)
      .map( data => {
        const localizationModel: ConsumerUILocalizationModel = JsUtil.mapToNewObject(data, new ConsumerUILocalizationModel());
        localizationModel.primaryLocalization = JsUtil.mapToNewObject(data.primaryLocalization, new LocalizationResourceModel());
        localizationModel.secondaryLocalization = JsUtil.mapToNewObject(data.secondaryLocalization, new LocalizationResourceModel());
        // temp until we get unitstate on spireplus endpoint
        self.appInfo.unitLocation = localizationModel.UnitLocation;
        console.log('UnitLocation=====>>', self.appInfo.unitLocation);
        return localizationModel;
      })
      .pipe(
        catchError(this.handleError('localization', null))
      );
  }

  private getOverrides(): Observable<Override> {
    console.log('Getting Overrides...');
    const url = this.appInfo.config.urls.overrides;
    return this.http.get<Override>(url)
      .map( data => JsUtil.mapToNewObject(data, new Override()) )
      .pipe(
        catchError(this.handleError('override', new Override()))
      );
  }

  mapUnitState(unitState: any): any {

    if (!unitState.UnitType) {
      unitState.UnitType = unitState._unitType;
    }

    // a bit of a workaround for differences between altspire and spireplus

    // CountryLanguageCode = 'en-us';
    // UnitLocation = 'US';
    // UnitType = '';
    // PrimaryConsumerLanguage = 'en-us';
    // SecondaryConsumerLanguage = 'none';

    if (!unitState.CountryLanguageCode) {
      unitState.CountryLanguageCode = unitState._countryLanguageCode;
    }

    if (!unitState.UnitLocation) {
      unitState.UnitLocation = unitState._unitLocation;
    }

    if (!unitState.PrimaryConsumerLanguage) {
      unitState.PrimaryConsumerLanguage = unitState._primaryConsumerLanguage;
    }

    if (!unitState.SecondaryConsumerLanguage) {
      unitState.SecondaryConsumerLanguage = unitState._secondaryConsumerLanguage;
    }
    const fixedUp: UnitState = JsUtil.mapToNewObject(unitState, new UnitState());
    return fixedUp;
  }

  private getPourables(): Observable<PourItemModel> {
    const url = this.appInfo.config.urls.pourables;
    return this.http.get<PourItemModel>(url)
      .map( data => this.mapPourables(data) )
      .pipe(
        catchError(this.handleError('getPourItems', null))
      );
  }

  private mapPourables(pourItemModel: PourItemModel) {
    const targetPourItemModel = new PourItemModel();

    this.addToPourableDesignModel(pourItemModel.brands, targetPourItemModel, 'brands');
    this.addToPourableDesignModel(pourItemModel.curatedMixes, targetPourItemModel, 'curatedMixes');
    this.addToPourableDesignModel(pourItemModel.waters, targetPourItemModel, 'waters');
    this.addToFlavorToPourableDesignModel(pourItemModel.flavors, targetPourItemModel);
    this.addToPourableDesignModel(pourItemModel.topCombinations, targetPourItemModel, 'topCombinations');
    const unorderedPourMenu = pourItemModel.brands.concat(pourItemModel.curatedMixes);

    targetPourItemModel.pourMenu = _.orderBy(unorderedPourMenu, ['Weighting'], ['asc']);

    targetPourItemModel.homeMenu = JsUtil.mapToNewObject(pourItemModel.homeMenu, new PlatformMenuLayout());

    return targetPourItemModel;
  }

  addToPourableDesignModel(designItems: PourableDesign[],
                           targetPourItemModal: PourItemModel, targetPropertyName: string) {

    _.forEach(designItems, function(item: PourableDesign) {
      const pourableDesign: PourableDesign = JsUtil.mapToNewObject(item, new PourableDesign());
      pourableDesign.pourItem = JsUtil.mapToNewObject(pourableDesign.pourItem, new PourItem());
      pourableDesign.pourItem.isDisabled = true ;
      pourableDesign.design = JsUtil.mapToNewObject(pourableDesign.design, new DesignNode());
      pourableDesign.design.assets = JsUtil.mapToNewObject(pourableDesign.design.assets, new DesignAssets());
      pourableDesign.design.colors = JsUtil.mapToNewObject(pourableDesign.design.colors, new DesignColors());
      pourableDesign.design.particlesHome = JsUtil.mapToNewObject(pourableDesign.design.particlesHome, new DesignParticles());
      if (pourableDesign.design.secondaryAnimation) {
          pourableDesign.design.secondaryAnimation = JsUtil.mapToNewObject(pourableDesign.design.secondaryAnimation, new DesignSecondaryAnimation());
      }

      if (pourableDesign.design.secondaryAnimationAda ) {
        pourableDesign.design.secondaryAnimationAda = JsUtil.mapToNewObject(pourableDesign.design.secondaryAnimationAda, new DesignSecondaryAnimation());
      }

      if (pourableDesign.design.secondaryAnimation_5) {
          pourableDesign.design.secondaryAnimation_5 = JsUtil.mapToNewObject(pourableDesign.design.secondaryAnimation_5, new DesignSecondaryAnimation());
      }

      if (pourableDesign.design.secondaryAnimationAda_5) {
           pourableDesign.design.secondaryAnimationAda_5  = JsUtil.mapToNewObject(pourableDesign.design.secondaryAnimationAda_5, new DesignSecondaryAnimation());
      }
      const calorieCups: CalorieCup[] = [];
      _.forEach(pourableDesign.CalorieCups, function(calorieCup) {
        calorieCups.push(JsUtil.mapToNewObject(calorieCup, new CalorieCup()));
      });

      pourableDesign.CalorieCups = calorieCups;
      targetPourItemModal[targetPropertyName].push(pourableDesign);
    });
  }

  addToFlavorToPourableDesignModel(designItems: FlavorDesign[],
                           targetPourItemModal: PourItemModel) {

    _.forEach(designItems, function(item: FlavorDesign) {
      const flavorDesign: FlavorDesign = JsUtil.mapToNewObject(item, new FlavorDesign());
      flavorDesign.pourItem = JsUtil.mapToNewObject(flavorDesign.pourItem, new PourItem());
      flavorDesign.design = JsUtil.mapToNewObject(flavorDesign.design, new FlavorDesignVisual());
      flavorDesign.select = JsUtil.mapToNewObject(flavorDesign.select, new FlavorDesignDetail());
      flavorDesign.spin = JsUtil.mapToNewObject(flavorDesign.spin, new FlavorDesignDetail());
      flavorDesign.name = flavorDesign.pourItem.id.substr(0, 1).toUpperCase() +
                          flavorDesign.pourItem.id.substr((1));

      targetPourItemModal.flavors.push(flavorDesign);
    });
  }

  private getPlatform() {
    const url = this.appInfo.config.urls.platform;

    return this.http.get<PlatformModel>(url)
    .map( data => this.mapPlatform(data) )
    .pipe(
      catchError(this.handleError('getPlatform', new PlatformModel()))
    );
  }

  private mapPlatform(platform: any) {
    console.log('platform File', platform);
    return platform;
  }

  private getFlavors(): Observable<FlavorDesign[]> {
    const url = this.appInfo.config.urls.flavors;
    return this.http.get<any>(url)
    .map( data => this.mapFlavors(data) )
    .pipe(
      catchError(this.handleError('getFlavors', []))
    );
  }

  private mapFlavors(flavorList: any) {
      const flavorsArray: FlavorDesign[] = [];
      flavorList.forEach((flavorFrom) => {
        let flavorTo = new FlavorDesign();
        flavorTo =  JsUtil.mapToNewObject(flavorFrom, flavorTo) ;
        flavorTo.design = JsUtil.mapToNewObject(flavorFrom.design, new FlavorDesignVisual());
        flavorTo.select = JsUtil.mapToNewObject(flavorFrom.select, new FlavorDesignDetail());
        flavorTo.spin = JsUtil.mapToNewObject(flavorFrom.spin, new FlavorDesignDetail());

        flavorsArray.push(flavorTo);
      });
      return flavorsArray;
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      const msg = `ERROR: ${error.status}, ${JSON.stringify(error.error)}, ${error.url} `;

      console.error(msg); // log to console

      // iffy, as the reason we might get an error because the
      // server isn't there
      PublishEvent.Create(PubSubTopic.logToServer, this.objectId)
        .SetDataArgumentTo(msg)
        .Send();

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  validatePinNumber(pinNumber: string) {
    const url = this.appInfo.config.urls.validatepin;
    this.http.get<any>(url, {
        params: {  pin: pinNumber  }
      })
      .pipe(catchError( this.handleError('validatePinNumber', { 'isPinValid' : false })))
      .subscribe(data => {
        PublishEvent.Create(PubSubTopic.validatePinResult, this.objectId)
        .SetDataArgumentTo(data)
        .Send();
      });
  }
}
