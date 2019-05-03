import { Component, OnInit, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import {AppInfoService} from '../../services/app-info.service';
import {PublishEvent, PubSubTopic} from '../../universal/pub-sub-types';
import {JsUtil} from '../../universal/JsUtil';

@Component({
  selector: 'app-blocker',
  templateUrl: './blocker.component.html',
  styleUrls: ['./blocker.component.css']
})
export class BlockerComponent implements OnInit {
  objectId: number;
  constructor(private appInfo: AppInfoService, private changeDetector: ChangeDetectorRef, private app: ApplicationRef) {
    this.objectId = JsUtil.getObjectId();

    console.log('ctor.blocker', this.objectId);
    
    // since we turned zone's off, we need this to force the screen to draw when we
    // are routing from blocker
    setTimeout(() => {
      app.tick();
  }, 250);
  }

  ngOnInit() {
    console.log('OnInit.blocker', this.objectId);
    this.changeDetector.detectChanges();
  }

  onKeydown(event: KeyboardEvent) {
      if (event.code === 'Semicolon') {
        // secret key to activate pinpad
        PublishEvent.Create(PubSubTopic.showPinpad, this.objectId)
          .Send();
      }
  }
}
