import {Component, ElementRef, OnInit, ViewChild, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {AppInfoService} from '../../services/app-info.service';
import {JsUtil} from '../../universal/JsUtil';
import {PublishEvent, PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../../universal/pub-sub-types';
import {ButtonModel, Gestures, ButtonEventData, ApiResult} from '../../universal/app.types';
import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from '../../services/configuration.service';
import { LocalizationService } from '../../services/localization.service';

@Component({
  selector: 'app-pinpad',
  templateUrl: './pinpad.component.html',
  styleUrls: ['./pinpad.component.css']
})
export class PinpadComponent implements OnInit, OnDestroy {

  objectId: number ;
  isOpen = false ;
  countKeypresses = 0 ;
  pinNumber = '';
  keypadButtons: ButtonModel[] = [];
  pinHeaderText = 'ENTER PIN';
  bottomText = '';

  constructor(public appInfo: AppInfoService,
              private configurationService: ConfigurationService,
              private changeDetector: ChangeDetectorRef
  ) {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.PinPad ', this.objectId);
    this.prepareButtons();
  }

  prepareButtons() {
    const keys: ButtonModel[] = [];
    for (let i = 1; i < 10; i++) {
      const key = new ButtonModel();
      key.Id = i.toString();
      key.Label = i.toString();
      key.gesture = Gestures.singletap;
      key.ButtonType = 'keypad';
      keys.push(key);
    }
    const zero = new ButtonModel();
    zero.Id = '0';
    zero.Label = '0';
    zero.gesture = Gestures.singletap;
    zero.ButtonType = 'keypad';
    keys.push(zero);

    const del = new ButtonModel();
    del.Id = 'del';
    del.Label = 'Delete';
    del.gesture = Gestures.singletap;
    del.ButtonType = 'keypad';
    // del.Width ='50'
    keys.push(del);
    this.keypadButtons = keys;
  }

  ngOnInit() {
    const self = this ;
    console.log('pinpad.ngoninit');

    SubscribeEvent.Create(PubSubTopic.showPinpad, this.objectId)
      .HandleEventWithThisMethod(e => self.showPinpad())
      .Done();

      SubscribeEvent.Create(PubSubTopic.buttonGesture, this.objectId)
        .HandleEventWithThisMethod(e => self.handleKeypad(e.data))
        .Done();

      SubscribeEvent.Create(PubSubTopic.validatePinResult, this.objectId)
      .HandleEventWithThisMethod(e => self.onValidatePinResult(e.data))
      .Done();

      SubscribeEvent.Create(PubSubTopic.localizationChanged, this.objectId)
        .HandleEventWithThisMethod(e => self.handleLocalizationChanged())
        .Done();
  }

  handleLocalizationChanged() {
    this.bottomText = LocalizationService.LocalizeString('keypad.bottom.message');
  }

  ngOnDestroy(): void {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }

  showPinpad() {
    console.log('show pinpad');
    this.pinNumber = '';
    this.isOpen = true ;
    this.countKeypresses = 0 ;
    this.changeDetector.detectChanges();
  }

  handleKeypad(data: ButtonEventData) {
    if (data.buttonModel.Id === 'del' && this.pinNumber.length > 0) {
      this.pinNumber = this.pinNumber.substring(0, this.pinNumber.length - 1);

    } else if (data.buttonModel.Id !== 'del' && this.pinNumber.length <= 3 ) {

      this.pinNumber += data.buttonModel.Id;

      if (this.pinNumber.length === 4) {
        this.isOpen = false ;

        if (this.pinNumber === '9735') {
          this.showConsumerUI();
        } else {
          this.configurationService.validatePinNumber(this.pinNumber);
        }
      }
    }

    this.changeDetector.detectChanges();
  }

  showConsumerUI() {
    this.appInfo.hasBlocked = true ;
    this.appInfo.navigateToPage('consumerui');
    this.changeDetector.detectChanges();
    const self = this;
    setTimeout(function(that) {
      that.changeDetector.detectChanges();
    }, 1000, self);
  }

  onValidatePinResult(data: ApiResult) {
    console.log('onValidatePinResult ->', data);

    if (data.Success) {
      console.log('pubsub out, switchToServiceUI');
      PublishEvent.Create(PubSubTopic.switchToServiceUI, this.objectId)
        .SetDataArgumentTo(data)
        .Send();
    }
  }

  onKeyPress(e: KeyboardEvent) {
    this.countKeypresses++;
    console.log('count', this.countKeypresses);
    if (this.countKeypresses === 4) {
      console.log('got keys, validate');
      this.isOpen = false ;
    }
  }
}
