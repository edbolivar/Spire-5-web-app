import { Injectable } from '@angular/core';
import {PubSubEventArgs, PubSubSubscriptionToken, PubSubItem, EventDescriptor, PubSubTopic} from './pub-sub-types';

import {JsUtil} from './JsUtil';
import * as _ from 'lodash';

@Injectable()
export class PubSubService {
  objectId: number ;
  private subscriptions: PubSubSubscriptionToken[] = [] ;
  private pubSubItems: PubSubItem[] = [] ;
  eventBufferSize = 5 ;
  socketClient: any ;

  eventDescriptors: EventDescriptor[] = [];

  constructor() {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.PubSubService', this.objectId);

    // oldway
    this.configureObservables();
  }

  // new way, called externally from appComponent because
  // appInfo must be available (pubsub is created before so we can't do it from ctor)
  configureUsingPubSubTopicWithoutEventOptions() {
    // needs to be called externally from appComponent, AFTER appInfo is ready
    let pubsubTopic: string ;
    Object.keys(PubSubTopic).forEach(function(key: string) {
      pubsubTopic = PubSubTopic[key] ;
      EventDescriptor.Create(pubsubTopic);
    });
  }

  subscribe(token: PubSubSubscriptionToken) {
    const index = this.subscriptions.indexOf(token);

    if (index > -1) {
      console.log("WARNING - token already subscribed (indexOf, Instance)", index, token ) ;
      return ;
    }

    if (token.consumerObjectId > 0 && ! token.allowMultipleSubscriptionsSameEventSameConsumer) {
      const existingToken = this.subscriptions.find(function(item){
        return (token.pubsubTopic === item.pubsubTopic && token.consumerObjectId === item.consumerObjectId );
      }) ;

      if (existingToken) {
        console.log("WARNING - token already subscribed (pubsubTopic+viewModelObjectId)", token) ;
        token.isActive = false ;
        return ;
      }
    }
    this.subscriptions.push(token);

    // send last event on subscribe. this solves problem of something having to be alive
    // at the time of the event. HUGE BENEFIT.
    const item = this.pubSubItems.find(function (item){
      return (item.pubsubTopic === token.pubsubTopic) ;
    });

    this.processEventForToken(token, item) ;

    // send last event on subscribe. this solves problem of something having to be alive
    // at the time of the event. HUGE BENEFIT.
    const self = this ;
    const eventDescriptor: EventDescriptor = this.eventDescriptors.find(function (item: EventDescriptor){
      return (item.pubsubTopic === token.pubsubTopic) ;
    });

    if (!eventDescriptor) {
      // pubsubTopic has not been defined for the new way
      return ;
    }

    this.processPEventForToken(token, eventDescriptor) ;
  }

  // new way with EventDescriptor
  publish(e: PubSubEventArgs) {

    // find the descriptor for the incoming event
    const eventDescriptor: EventDescriptor = this.eventDescriptors.find(function (eventDescriptorItem: EventDescriptor){
      return (eventDescriptorItem.pubsubTopic === e.pubsubTopic) ;
    });

    if (!eventDescriptor) {
      console.log("ERROR EventDescriptor not found", e.pubsubTopic) ;
      return ;
    }

    // manage the event buffer
    if (eventDescriptor.events.length === eventDescriptor.eventBufferSize) {
      // remove the first item from the list, as we reached the buffer size
      eventDescriptor.events.shift() ;
    }
    eventDescriptor.events.push(e) ;

    // now process the event
    this.processPEventForAllSubscribers(eventDescriptor) ;
  }

  // new way
  private processPEventForAllSubscribers(eventDescriptor: EventDescriptor) {
    const self = this ;

    // get all the tokens for this pubsubTopic
    const tokensForThisTopic: PubSubSubscriptionToken[] = this.subscriptions.filter(function(loopToken: PubSubSubscriptionToken){
      return (loopToken.pubsubTopic === eventDescriptor.pubsubTopic) ;
    }) ;


    if (eventDescriptor.isSocket) {
      // it's likely that there won't be any subscribers client side
      // so we need to processes it by sending it to the other side
      self.sendSocket(eventDescriptor) ;
    }

    tokensForThisTopic.forEach(function(myToken){
      self.processPEventForToken(myToken, eventDescriptor) ;
    });

  }

  sendSocket(eventDescriptor: EventDescriptor) {
    const e = eventDescriptor.events[0];
    this.socketClient.send(e) ;
  }




  // new way
  private processPEventForToken(token: PubSubSubscriptionToken, eventDescriptor: EventDescriptor) {

    if (eventDescriptor.events.length === 0) {
      // console.log("pubsub.processEventForToken.noEventToSend");
      return;
    }

    if (!token.filterPredicate) {
      // just send the last event
      const event = eventDescriptor.events[eventDescriptor.events.length - 1];
      // console.log("No Filter, Sending Last Event:",token,item,event) ;
      token.actionCallback(event);
    } else if (token.sendCurrentEventOnly) {
      // subscriber can indicate that only the last event is sent
      const event = eventDescriptor.events[eventDescriptor.events.length - 1];
      const passesFilter = token.filterPredicate(event);
      if (passesFilter) {
        token.actionCallback(event);
      }
    } else {
      // it's got a filter so we have to cycle through past events to see what matches
      // do it in reverse order, so we come across the most recent event first
      for (let i = eventDescriptor.events.length - 1; i > -1; i--) {
        const event = eventDescriptor.events[i];
        const passesFilter = token.filterPredicate(event);
        if (passesFilter) {
          token.actionCallback(event);
          break;
        }
      }
    }
  }

  addEventDescriptor(pubSubEventDescriptor: EventDescriptor) {
    // --- if the topic already exists, remove it, last one in, wins
    const ifExistsIndex = _.findIndex(this.eventDescriptors, function(item: EventDescriptor) {
      return item.pubsubTopic === pubSubEventDescriptor.pubsubTopic ;
    });
    if (ifExistsIndex > -1) {
      this.eventDescriptors.splice(ifExistsIndex, 1) ;
    }
    this.eventDescriptors.push(pubSubEventDescriptor) ;
  }

  unsubscribeByToken(token: PubSubSubscriptionToken) {
    const index = this.subscriptions.indexOf(token);
    if (index > -1) {
      this.subscriptions.splice(index, 1);
    }
  }

  unsubscribeByConsumer(objectIdOfConsumer: number) {
    const self = this ;
    const itemsToUnSubscribe  = this.subscriptions.filter(function(token : PubSubSubscriptionToken){
      return (token.consumerObjectId == objectIdOfConsumer) ;
    }) ;

    itemsToUnSubscribe.forEach(function(token : PubSubSubscriptionToken){
      self.unsubscribeByToken(token) ;
    });
  }

  // ----- old way, obsolete -------------------------------------------------------------

  // old way
  private processEventForToken(token: PubSubSubscriptionToken, item: PubSubItem) {

    if (item.events.length === 0) {
      // console.log("pubsub.processEventForToken.noEventToSend");
      return;
    }

    if (!token.filterPredicate) {
      // just send the last event
      const event = item.events[item.events.length - 1];
      // console.log("No Filter, Sending Last Event:",token,item,event) ;
      token.actionCallback(event);
    } else {
      // it's got a filter so we have to cycle through past events to see what matches
      // do it in reverse order, so we come across the most recent event first
      for (let i = item.events.length - 1; i > -1; i--) {
        const event = item.events[i];
        const passesFilter = token.filterPredicate(event);
        if (passesFilter) {
          token.actionCallback(event);
          break;
        }
      }
    }
  }

  // old way
  publishUsingEventArgs(e: PubSubEventArgs) {
    const item: PubSubItem = this.pubSubItems.find(function (item){
      return (item.pubsubTopic === e.pubsubTopic) ;
    });

    if (!item) {
      console.log("ERROR PubSubItem not found in pubSubItems2 :", e.pubsubTopic) ;
      return ;
    }

    if (item.events.length === this.eventBufferSize) {
      // remove the first item from the list, as we reached the buffer size
      item.events.shift() ;
      // console.log("Removing 1st Event in Stack",item.events) ;
    }
    item.events.push(e) ;
    // console.log("Adding event to",item.pubsubTopic,e) ;

    this.processEventForAllSubscribers(item) ;
  }

  // old way
  configureObservables() {
    const self = this ;
    const numberOfItemsInReplayBuffer = 5 ;
    let pubsubTopic : string ;
    for (const key in PubSubTopic) {
      pubsubTopic = PubSubTopic[key] ;

      const item: PubSubItem = new PubSubItem(pubsubTopic ) ;
      this.pubSubItems.push(item) ;
    }
  }

  private processEventForAllSubscribers(item : PubSubItem) {
    // get all the tokens for this pubsubTopic
    const tokensForThisTopic: PubSubSubscriptionToken[] = this.subscriptions.filter(function(loopToken: PubSubSubscriptionToken){
      return (loopToken.pubsubTopic == item.pubsubTopic) ;
    }) ;
    for (let i = 0, len = tokensForThisTopic.length; i < len; i++) {
      const myToken = tokensForThisTopic[i] ;
      this.processEventForToken(myToken, item) ;
    }
  }
}
