import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubscribeEvent, PubSubEventArgs, PubSubSubscriptionToken, PublishEvent, PubSubTopic} from '../../universal/pub-sub-types';
import {AppInfoService} from '../../services/app-info.service';
import {JsUtil} from '../../universal/JsUtil';

@Component({
  selector: 'app-pubsub-tester',
  templateUrl: './pubsub-tester.component.html',
  styleUrls: ['./pubsub-tester.component.css']
})
export class PubsubTesterComponent implements OnDestroy {
  objectId: number ;
  token: PubSubSubscriptionToken ;
  log: string[] = [] ;
  index: number = 1 ;
  messages: string[] = [];
  ioConnection: any;

  constructor(private appInfo: AppInfoService) {
    this.objectId = JsUtil.getObjectId() ;
    const self = this;
    console.log('ctor.PubSubTester', this.objectId);
    this.subscribe() ;

    SubscribeEvent.Create(PubSubTopic.pourComplete, this.objectId)
      .HandleEventWithThisMethod(args => self.handlePourComplete(args))
      .Done();
  }

  handlePourComplete(e: PubSubEventArgs) {
    this.log.push('socket message from server: ' + JSON.stringify(e)) ;
  }

  clearLog() {
    this.log = [] ;
  }

  subscribe() {
    this.log.push('subscribe.by.token') ;
    const self = this;

    const token = SubscribeEvent
      .Create(PubSubTopic.testEvent, this.objectId)
      .HandleEventWithThisMethod(args => self.handlePEvent(args))
      .ApplyFilterPredicate(res => res.sourceObjectId === self.objectId)
      .Done()
      .subscriptionToken ;

    if (token.isActive) {
      this.token = token ;
      this.token.tag = 'Subscribe - ONE' ;
    }
  }

  ngOnDestroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId) ;
  }
  handlePEvent(e: PubSubEventArgs) {
    // losing track of this
    this.log.push('PEvent==>' + e.data.source) ;
  }

  subscribe2() {
    this.log.push('subscribe2.by.token') ;
    const self = this;
    const token = SubscribeEvent
      .Create(PubSubTopic.testEvent, this.objectId)
      .HandleEventWithThisMethod((res) => this.onDataReady2(res))
      .ApplyFilterPredicate(res => res.sourceObjectId === self.objectId)
      .AllowMultipleSubscriptionsSameEventSameConsumer()
      .Done()
      .subscriptionToken ;


    token.tag = 'Subscribe2 - TWO' ;

  }

  testIODriver() {
    // PublishEvent.Create(PubSubTopic.testIODriver, this.objectId)
    //   .SetDataArgumentTo(({from: "pubsubTester", info: 'randomInfo', count: this.index}))
    //   .Send();
  }

  sendSocket() {
    // PublishEvent.Create(PubSubTopic.testSendToServer, this.objectId)
    //   .SetDataArgumentTo(({from: 'pubsubTester', info: 'randomInfo', count: this.index}))
    //   .Send();
  }


  onClick() {

    PublishEvent.Create(PubSubTopic.testEvent, this.objectId)
      .SetDataArgumentTo({source: this.index++})
      .Send();

  }

  unsubscribeByToken() {
    this.log.push('unsubscribeByToken') ;
    SubscribeEvent.UnSubscribeByToken(this.token);

    this.appInfo.pubsub.unsubscribeByToken(this.token) ;
  }

  onDataReady(e: PubSubEventArgs) {
    this.log.push('SubscriptionOne==>' + e.data.source) ;
  }

  onDataReady2(e: PubSubEventArgs) {
    this.log.push('SubscriptionTwo==>' + e.data.source) ;
  }

}
