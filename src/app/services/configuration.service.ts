import { Injectable } from '@angular/core';
import {AppInfoService} from './app-info.service';
import {JsUtil} from '../universal/JsUtil';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {of} from 'rxjs/observable/of';
import 'rxjs/add/observable/forkJoin';
import {catchError} from 'rxjs/operators';
import {PublishEvent, PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../universal/pub-sub-types';
import {
  Bubbles,
  ConfigurationData, DesignAnimation, DesignAssets, DesignColors, DesignNode, DesignParticles,
  FlavorDesign,
  FlavorDesignDetail,
  FlavorDesignVisual,
  IdleState, LocalizedItems, OutOfOrderEventArgs, PourableDesign,
  PourItem,
  PourItemModel, StringKeyValuePair, Home, CalorieCup, ConsumerUILocalizationModel, LocalizationResourceModel
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

      SubscribeEvent.Create(PubSubTopic.outOfOrderChanged, this.objectId)
        .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
           self.handleOutOfOrder(e.data);
        }).Done();

  }
  handleOutOfOrder(e: OutOfOrderEventArgs) {
    console.log('got out of order', e);
  }
  loadConfigurationData() {
    console.log('>>> Get ConfigurationData');

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
      this.getHome()
    )
    .subscribe(data => {
        const configurationData: ConfigurationData = new ConfigurationData();
        configurationData.platform = data[0];
        configurationData.flavors =  data[1];
        configurationData.pourables = data[2];
        configurationData.idleState = data[3]; // not really using idlestate from here
        configurationData.bubbles = data[4];
        configurationData.animations = data[5];
        configurationData.localizedItems = data[6];
        configurationData.home = data[7];
        this.adjustPlatformForProperLayout(configurationData);

        console.log('>>>Got ConfigurationData>>>', configurationData);

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
  private adjustPlatformForProperLayout(configData: ConfigurationData) {
      const countOfItems = configData.pourables.pourMenu.length;
      let tagName = `homeMenu_${countOfItems}`;
      if (configData.platform.layout[tagName]) {
        // we have a layout name
        console.log('==Mapping Layout==');
        configData.platform.layout.homeMenu = 
          configData.platform.layout[tagName];
      } else {
        tagName = 'homeMenu';
      }
     
      console.log(`mapped layout to [${tagName}] for [${countOfItems}] items`);
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

  private getHome(): Observable<Home> {
    const url = this.appInfo.config.urls.home;
    return this.http.get<Home>(url)
      .map( data =>  JsUtil.mapToNewObject(data, new Home()) )
      .pipe(
        catchError(this.handleError('home', new Home()))
      );
  }

  private getBubbles(): Observable<Bubbles> {
    const url = this.appInfo.config.urls.bubbles;
    return this.http.get<Bubbles>(url)
      .map( data => JsUtil.mapToNewObject(data, new Bubbles()) )
      .pipe(
        catchError(this.handleError('bubbles', null))
      );
  }

  private getLocalization(): Observable<ConsumerUILocalizationModel> {
    const url = this.appInfo.config.urls.localization;
    return this.http.get<ConsumerUILocalizationModel>(url)
      .map( data => {
        const localizationModel: ConsumerUILocalizationModel = JsUtil.mapToNewObject(data, new ConsumerUILocalizationModel());
        localizationModel.primaryLocalization = JsUtil.mapToNewObject(data.primaryLocalization, new LocalizationResourceModel());
        localizationModel.secondaryLocalization = JsUtil.mapToNewObject(data.secondaryLocalization, new LocalizationResourceModel());
        return localizationModel;
      })
      .pipe(
        catchError(this.handleError('localization', null))
      );
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
    
    // @@TEST for LAYOUT Selection =======================
    let brandsToTestWith = 8; // pourItemModel.brands.length;
    // brandsToTestWith + curated mixes, gives us the layout
    if (this.appInfo.numberOfBrands) {
      brandsToTestWith = this.appInfo.numberOfBrands;
    }
    
    pourItemModel.brands = pourItemModel.brands.slice(0, brandsToTestWith);

    this.addToPourableDesignModel(pourItemModel.brands, targetPourItemModel, 'brands');
    this.addToPourableDesignModel(pourItemModel.curatedMixes, targetPourItemModel, 'curatedMixes');
    this.addToPourableDesignModel(pourItemModel.waters, targetPourItemModel, 'waters');
    this.addToFlavorToPourableDesignModel(pourItemModel.flavors, targetPourItemModel);
    this.addToPourableDesignModel(pourItemModel.topCombinations, targetPourItemModel, 'topCombinations');
    targetPourItemModel.pourMenu = pourItemModel.brands.concat(pourItemModel.curatedMixes);

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

      const calorieCups: CalorieCup[] = [];
      _.forEach(pourableDesign.CalorieCups, function(item){
        calorieCups.push(JsUtil.mapToNewObject(item, new CalorieCup()));
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
      flavorDesign.name = flavorDesign.pourItem.id.substr(0,1).toUpperCase() +
                          flavorDesign.pourItem.id.substr((1));

      targetPourItemModal.flavors.push(flavorDesign);
    });
  }


  private getPlatform() {
    const url = this.appInfo.config.urls.platform;

    return this.http.get<any>(url)
      .pipe(
        catchError(this.handleError('getPlatform', []))
      );
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
    this.http.get<any>(url,{
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
