import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ButtonModel, ButtonSet, DriveThruData, PDMDataArg} from '../../universal/app.types';
import {PubSubEventArgs, PubSubSubscriptionToken, PubSubTopic, SubscribeEvent} from '../../universal/pub-sub-types';
import {AppInfoService} from '../../services/app-info.service';
import {JsUtil} from '../../universal/JsUtil';


@Component({
  selector: 'app-button-panel',
  templateUrl: './button-panel.component.html',
  styleUrls: ['./button-panel.component.css']
})
export class ButtonPanelComponent implements OnInit, OnDestroy {
  @Input('button-set') buttonSet: string;
  @Input('title') title: string;
  @Input('subscribe-to') subscribeTo: string;
  @Input('centerAlign') centerAlign = false;
  @Input('items-source') itemsSource: any;

  objectId: number ;
  buttons: ButtonModel[] = [];
  onDataReadyToken: PubSubSubscriptionToken ;
  showTitle = true ;

  constructor(public appInfo: AppInfoService) {
    this.objectId = JsUtil.getObjectId() ;
    console.log('ctor.ButtonPanel', this.objectId);
  }

  ngOnInit() {
    // have to subscribe here, as we need the @Input(s) to be resolved

    if (this.itemsSource) {
      // if it's straight up binding then items-source will be specified
      this.buttons = this.itemsSource;
    } else {
      // otherwise, we will connect using the event
      this.subscribeToEvents();
    }
  }

  subscribeToEvents() {
    const self = this ;

    SubscribeEvent.Create(PubSubTopic.pdmDataReady, this.objectId)
      .HandleEventWithThisMethod((e) => self.onDataReady(e))
      .ApplyFilterPredicate(res => {
          return res.data.pdmtype === self.subscribeTo;
      } )
      .Done();
  }

  onDataReady(e: PubSubEventArgs) {
    const pdmargs: PDMDataArg = e.data;
    const objectWithNamedButtonLists: any = pdmargs.data ;

    if (objectWithNamedButtonLists[this.buttonSet]) {
      this.buttons = objectWithNamedButtonLists[this.buttonSet];

      // once we have data, we can unsubscribe, it's not going to change
      SubscribeEvent.UnSubscribeByConsumer(this.objectId);
    } else {
      console.log('buttonPanel.debug: incorrect buttonSet not found on incoming data:', this.buttonSet, objectWithNamedButtonLists) ;
    }
  }



  ngOnDestroy() {
    // make sure we get the unsubscribes
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }
}
