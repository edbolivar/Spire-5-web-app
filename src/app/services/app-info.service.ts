import {Injectable, Injector} from '@angular/core';

import * as _ from 'lodash';
import {Router, NavigationEnd} from '@angular/router';
import { SocketClient } from './socket.client';
import {AppConfig, ScreenMetrics} from '../universal/app.types';
import {SubscribeEvent, PubSubEventArgs, PubSubSubscriptionToken, PubSubTopic} from '../universal/pub-sub-types';
import {PubSubService} from '../universal/pub-sub.service';
import {environment} from '../../environments/environment';
import {JsUtil} from '../universal/JsUtil';
import {ConfigurationData} from '../universal/app.types';
import {LocalizationService} from './localization.service';


@Injectable()
export class AppInfoService {

  static instance: AppInfoService ;
  origin: string;
  timeDelayInMillisecondsForAutoClear = 20000 ;
  config: AppConfig = new AppConfig();
  ConfigurationData: ConfigurationData = new ConfigurationData();
  _objectIdSeed = 0;
  objectId: number;
  _isToastOpen = false;
  _toastMessage = '';
  isBlocker = false;
  hasBlocked = false;
  incomingEnvironment: any = environment ;
  localizationService: LocalizationService ;

  screenMetrics: ScreenMetrics =
    {
      // all temp, should be fed in from backend
      'buttonSize': '160px',
      'keypadButtonSize': '75px',
      'buttonSizeFlavorShots': '100px',
      'flavorOnTopCombinationSize': '40px',
      'actionButtonWidth': '160px',
      'actionButtonHeight': '56.715341772151895px',
      'buttonImageHeight' : '70%',
      'buttonImageWidth': '70%',
      'serviceActionButtonWidth' : '195px',
      'serviceActionButtonHeight' : '96px',
      'keypadWidth' : '75px',
      'keypadHeight' : '75px'

    };

  constructor(public pubsub: PubSubService,
              private router: Router,
              private injector: Injector) {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.appInfo', this.objectId);

    // a crutch for the fluent types that are not resolved by DI
    AppInfoService.instance = this ;

    this.loadEnvironmentFile();

    this.adjustPathsForOrigin();

    this.preparePubSubSocketClient();

    this.localizationService = new LocalizationService();
  }

  preparePubSubSocketClient() {
    const socketClient = this.injector.get(SocketClient);
    socketClient.initialize(this);
    this.pubsub.socketClient = socketClient ;
  }

  loadEnvironmentFile() {
    // copy props to the config property object on this class
    JsUtil.mapToNewObject(this.incomingEnvironment, this.config) ;
    this.isBlocker = this.config.isBlocker;
    console.log('=Environment=>', this.config, this.isBlocker);
  }

  adjustPathsForOrigin() {
    this.origin = location.origin + '/';
    if (this.origin.startsWith('http://localhost')) {
      // this.apiBaseUrl = `http://localhost:${this.config.serverPort}/` ;
    } else {
      // this.apiBaseUrl = this.origin ; // were using reverse proxy on nginx
    }
  }

  loadAppState() {}

  saveAppState() {}

  notifyViaToast(msg: string) {
    this._isToastOpen = true;
    this._toastMessage = msg;
    const self = this;

    // this indirectly clears the bound attribute on paper-toast
    setTimeout(function (that: AppInfoService) {
      that._isToastOpen = false;
    }, 5000, self);
  }

  navigateToPage(route: string) {
    const link = [route];
    this.router.navigate(link);
  }


}
