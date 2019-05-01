import {JsUtil} from './JsUtil';
import {AppInfoService} from '../services/app-info.service';


export class PubSubItem {
  events: PubSubEventArgs[] = [];
  constructor(public pubsubTopic: string) { }
}

export interface Predicate<T> {
  (item: T): boolean;
}

export class PubSubSubscriptionToken {
  objectId: number ;
  consumerObjectId: number = 0 ;
  pubsubTopic: string ;
  filterPredicate: Predicate<PubSubEventArgs> ;
  id: string = JsUtil.generateId() ;
  actionCallback: (response) => void;
  tag: any ;
  isActive: boolean = true;
  allowMultipleSubscriptionsSameEventSameConsumer: boolean = false ;
  sendCurrentEventOnly: boolean = false ;

  constructor(pubsubTopic: string, callback: (response) => void, consumerObjectId: number, filter?: Predicate<PubSubEventArgs>) {
    this.consumerObjectId = consumerObjectId ;
    this.pubsubTopic = pubsubTopic ;
    this.filterPredicate = filter ;
    this.actionCallback = callback ;
  }
}


export class PubSubEventArgs {
  pubsubTopic: string ;
  data: any ;
  sourceObjectId: number ;

  /**
   * @param sourceObjectId should be specified WHEN the consumer there are multiple publishers of the same event, and it matters
   */
  constructor(pubsubTopic: string, data: any, sourceObjectId: number = 0) {
    // were being explicit here so it is easy to read.
    this.pubsubTopic = pubsubTopic ;
    this.data = data ;
    this.sourceObjectId = sourceObjectId ;
  }
}

export class SubscribeEvent {
  subscriptionToken: PubSubSubscriptionToken;

  static Create(pubsubTopic: string, objectIdOfSubscriber: number): SubscribeEvent {
    const subscribeEvent = new SubscribeEvent();
    subscribeEvent.subscriptionToken = new PubSubSubscriptionToken(pubsubTopic, null, objectIdOfSubscriber, null);

    return subscribeEvent ;
  }

  static UnSubscribeByToken(subscriptionToken: PubSubSubscriptionToken) {
    AppInfoService.instance.pubsub.unsubscribeByToken(subscriptionToken);
  }

  static UnSubscribeByConsumer(objectId: number) {
    AppInfoService.instance.pubsub.unsubscribeByConsumer(objectId);
  }

  HandleEventWithThisMethod(actionCallback: (args: PubSubEventArgs) => void): SubscribeEvent {
    this.subscriptionToken.actionCallback = actionCallback;
    return this;
  }

  ApplyFilterPredicate(filterPredicate: Predicate<PubSubEventArgs>): SubscribeEvent {
    this.subscriptionToken.filterPredicate = filterPredicate;
    return this;
  }

  AllowMultipleSubscriptionsSameEventSameConsumer() {
    this.subscriptionToken.allowMultipleSubscriptionsSameEventSameConsumer = true ;
    return this;
  }
  SendCurrentEventOnly(): SubscribeEvent {
    this.subscriptionToken.sendCurrentEventOnly = true ;
    return this;
  }
  Done(): SubscribeEvent {
    AppInfoService.instance.pubsub.subscribe(this.subscriptionToken) ;
    return this;
  }
}

export class PublishEvent {
  eventArgs: PubSubEventArgs;

  static Create(pubsubTopic: string, objectIdOfPublisher: number): PublishEvent {
    const publishEvent = new PublishEvent();
    publishEvent.eventArgs = new PubSubEventArgs(pubsubTopic, '', objectIdOfPublisher) ;
    return publishEvent ;
  }

  SetDataArgumentTo(data: any): PublishEvent {
    this.eventArgs.data = data ;
    return this;
  }

  Send(): PublishEvent {
    AppInfoService.instance.pubsub.publish(this.eventArgs) ;
    return this;
  }
}

export class EventDescriptor {
  pubsubTopic: string ;
  eventBufferSize: number = 5;
  isSocket: boolean = false ;
  events: PubSubEventArgs[] = [];
  dataArgumentType: string = '' ;
  isSendToServer: boolean = false;
  isSendToClient: boolean = false ;

  static Create(pubsubTopic: string): EventDescriptor {
    const eventDescriptor = new EventDescriptor();
    eventDescriptor.pubsubTopic = pubsubTopic ;

    // let's add it to appInfo, keep the external interface clean
    AppInfoService.instance.pubsub.addEventDescriptor(eventDescriptor) ;
    return eventDescriptor ;
  }

  WithABufferSizeOf(n: number): EventDescriptor {
    this.eventBufferSize = n ;
    return this ;
  }

  GoesToServer(): EventDescriptor {
    this.isSocket = true ;
    this.isSendToServer = true;
    return this;
  }

  GoesToClient(): EventDescriptor {
    this.isSocket = true ;
    this.isSendToClient = true;
    return this;
  }

  DataArgumentTypeAsString(argType: string): EventDescriptor {
    this.dataArgumentType = argType ;
    return this ;
  }
}

export class PubSubTopic {
  
  static configurationDataReady = 'configuration.data.ready';
  static pourComplete = 'pour.complete';

  static leftNavToggleVisibility = 'leftnav.toggle.visibility' ;
  static onLogin  = 'user.login';
  static onLogout  = 'user.logout' ;
  static testEvent  = 'test.event' ;


  static buttonGesture  = 'button.gesture' ;
  static buttonSelect  = 'button.select' ;



  static pdmDataReady  = 'product.datamodel.ready' ;


  static testIODriver = 'test.iodriver.event';
  static popupDialog = 'popup.dialog';


  // --- client to server ---
  static logToServer = 'logToServer';
  static switchToServiceUI = 'switchToServiceUI';
  static pingServer = 'pingServer';
  static pingClientAck = 'pingClientAck';

  static startPour = 'startPour';
  static stopPour = 'stopPour';
  static changeDx3Lighting = 'changeDx3Lighting';



  // --- server to client ---
  static configurationChanged = 'configurationChanged';
  static pingClient = 'pingClient';
  static pingServerAck = 'pingServerAck';

  static outOfOrderChanged = 'outoforder.changed';
  static showPinpad = 'show.pinpad';
  static validatePinResult = 'validate.pin.result';

  static idleStateChanged = 'idlestate.changed';

  static vibrateBody = 'vibrate.body';
  static localizationChanged = 'localization.changed';

  static adaKeyPressed = 'adaKeyPressed'; 
  static notifyKeyEvent = 'notifyKeyEvent';
  static notifyBrandButtonChangeSelected = 'notifyBrandButtonChangeSelected';
  static adaModeChanged = 'adaModeChanged';
  static resetApp = 'resetApp';
  
  static authorized = 'authorized';
}

