import AbstractScreen from '../../display/navigation/AbstractScreen';
import VideoPlayer from '../../display/components/VideoPlayer';
import Box from '../../display/shapes/Box';
import { AppInfoService } from '../../services/app-info.service';
import { IdleState } from '../../universal/app.types';
import { JsUtil } from '../../universal/JsUtil';
import {SubscribeEvent, PubSubTopic, PublishEvent} from '../../universal/pub-sub-types';

export default class ScanPage extends AbstractScreen {  

  static _instance: ScanPage;
  private _videos: VideoPlayer[];
  private _cover: Box;
  private _currentVideo: number;

  private _isDismissing: boolean;
  private _idleState: IdleState;
  objectId: number;

  constructor(appInfo: AppInfoService) {
    super(appInfo);
    this.objectId = JsUtil.getObjectId();
    this._videos = [];
    this.visible = false;
  }

  onIdleStateChanged(e: IdleState) {
    this._idleState = e;
  }

  public prepareToShow(): Promise<void> {

    PublishEvent.Create(PubSubTopic.changeDx3Lighting, this.objectId)
      .SetDataArgumentTo('#ffffff')
      .Send();

    return new Promise(resolve => {
      // Add cover
      // this._cover = new Box();
      // this._cover.alpha = 0;
      // this._cover.width = this.Platform.width;
      // this._cover.height = this.Platform.height;
      // this._cover.interactive = true;
      // this._cover.buttonMode = true;
      // this._cover.on('click', () => {
      //   this.dismiss();
      // });
      // this.addChild(this._cover);

      // this.alpha = 0;
      // this.visible = true;

    });
  }

  public async show(previousRoute?: string) {
  }

  public async transition(transitionInfluence: number) {

  }

  public destroy() {
    this._cover.destroy();
    ScanPage._instance = null;
    super.destroy();
  }

  public dismiss() {
    PublishEvent.Create(PubSubTopic.authorized, this.objectId)
      .Send();
  }
}
