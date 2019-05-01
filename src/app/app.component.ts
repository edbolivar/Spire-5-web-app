import {Component, ApplicationRef, HostListener} from '@angular/core';
import {AppInfoService} from './services/app-info.service';
import {JsUtil} from './universal/JsUtil';
import {EventDescriptor, PublishEvent, PubSubTopic} from './universal/pub-sub-types';
import {Title} from '@angular/platform-browser';
import {ConfigurationService} from './services/configuration.service';
import {LocalizationService} from './services/localization.service';
import {KEY_CODE} from './universal/app.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  objectId: number;

  constructor(public appInfo: AppInfoService,
              private configurationService: ConfigurationService,
              private localizationService: LocalizationService,
              private titleService: Title,
              private app: ApplicationRef
  ) {

    this.objectId = JsUtil.getObjectId();
    console.log('ctor.AppComponent', this.objectId);
    setTimeout(() => {
      // this.name = 'updated';
      app.tick();
    }, 1000);

    this.titleService.setTitle(this.appInfo.config.siteName);
    this.definePubSubEvents();

   
  }

  definePubSubEvents() {
    // iterate pubsubTopic if the events are just going to be similar/without special treatment
    // every topic will get a descriptor, but descriptor will be over-written if overridden downstream

    // we have to do this from here, because appInfo must be available (pubsub is created first)
    this.appInfo.pubsub.configureUsingPubSubTopicWithoutEventOptions();

    // describe events that have special options (last definition wins)
    EventDescriptor.Create(PubSubTopic.logToServer)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.testIODriver)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.startPour)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.stopPour)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.switchToServiceUI)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.pingServer)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.pingClientAck)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.configurationDataReady)
      .WithABufferSizeOf(1)
      .GoesToServer();

      EventDescriptor.Create(PubSubTopic.adaModeChanged)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.adaKeyPressed)
      .WithABufferSizeOf(1)
      .GoesToServer();

    EventDescriptor.Create(PubSubTopic.changeDx3Lighting)
      .WithABufferSizeOf(1)
      .GoesToServer();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode === KEY_CODE.ONE) {
      // activate keypad, when the number 1 is pressed
      PublishEvent.Create(PubSubTopic.showPinpad, this.objectId).Send();
    }
  }

}

