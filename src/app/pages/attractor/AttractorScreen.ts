import AbstractScreen from '../../display/navigation/AbstractScreen';
import VideoPlayer from '../../display/components/VideoPlayer';
import Box from '../../display/shapes/Box';
import LayoutUtils from '../../utils/LayoutUtils';
import AppRoutes from '../../display/navigation/AppRoutes';
import Fween from '../../../transitions/fween/Fween';
import {AppInfoService} from '../../services/app-info.service';
import {IdleState, ConfigurationData} from '../../universal/app.types';
import { JsUtil } from '../../universal/JsUtil';
import { SubscribeEvent, PubSubTopic } from '../../universal/pub-sub-types';
import { textSpanContainsPosition } from 'typescript';

export default class AttractorScreen extends AbstractScreen {

  private _videos: VideoPlayer[];
  private _cover: Box;
  private _currentVideo: number;

  private _fadeOutWhenHiding: boolean;
  private _isDismissing: boolean;
  private _idleState: IdleState;
  objectId: number ;

  constructor(appInfo: AppInfoService) {
    super(appInfo);
    this.objectId = JsUtil.getObjectId();
    this._videos = [];
    this.visible = false;
    const self = this;

    SubscribeEvent.Create(PubSubTopic.idleStateChanged, this.objectId)
    .HandleEventWithThisMethod((e) => self.onIdleStateChanged(e.data))
    .Done();
      
  }

  onIdleStateChanged(e: IdleState) {
    console.log("AttractorScreen got idlestate", e);
    this._idleState = e;
 } 


  public prepare(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add cover
      this._cover = new Box();
      this._cover.alpha = 0;
      this._cover.width = this.Platform.width;
      this._cover.height = this.Platform.height;
      this._cover.interactive = true;
      this._cover.buttonMode = true;
      this._cover.on('click', () => {
        this.dismiss(true);
      });
      this.addChild(this._cover);

      for (const resourceItem of this._idleState.videos) {
        const video = new VideoPlayer(resourceItem.url);
        video.loop = false;
        video.visible = false;
        video.pause();
        video.onLoaded.add(() => {
          if (this.areAllVideosLoaded()) {
            this.resizeAllVideos();
            resolve();
          }
        });
        video.onEnded.add(this.onVideoEnded.bind(this));
        this.addChild(video);
        this._videos.push(video);
      }
    });
  }

  public show(previousRoute?: string): Promise<void> {
    this.visible = true;
    this.playVideo(0);
    return Promise.resolve();

  }

  public hide(nextRoute?: string): Promise<void> {
    // TODO: must only fade out if interrupted; if not, can just display directly
    return new Promise((resolve) => {
      if (this._fadeOutWhenHiding) {
        Fween
          .use(this)
          .to({alpha: 0}, 1)
          .call(resolve).play();
      } else {
        resolve();
      }
    });
  }

  public destroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);

    this._videos.forEach((video, index) => {
      video.destroy();
    });
    this._videos = [];
    this._cover.destroy();
    super.destroy();
  }

  private onVideoEnded(video: VideoPlayer) {
    const videoIndex = this._videos.indexOf(video);
    if (videoIndex === this._currentVideo) {
      if (videoIndex === this._videos.length - 1) {
        // Finished last video
       // if (Config.get().attractor.loop) {
        if (this._idleState.loop) {
          // Should loop
          this.playVideo(0);
        } else {
          // Back to the interactive interface
          this.dismiss(false);
        }
      } else {
        // Play next video
        this.playVideo(videoIndex + 1);
      }
    }
  }

  private areAllVideosLoaded() {
    return this._videos.every((video) => video.isLoaded);
  }

  private resizeAllVideos() {
    // Resize all videos to fit within the viewport rectangle
    const viewport = {
      x: 0,
      y: 0,
      width: this.Platform.width,
      height: this.Platform.height,
    };

    for (const video of this._videos) {
      const videoSize = {
        width: video.intrinsicWidth,
        height: video.intrinsicHeight,
      };
      const videoRect = LayoutUtils.fitInsideRectangle(videoSize, viewport, true);
      video.x = videoRect.x;
      video.y = videoRect.y;
      video.width = videoRect.width;
      video.height = videoRect.height;
    }
  }

  private playVideo(videoIndex: number) {
    this._currentVideo = videoIndex;

    this._videos.forEach((video, index) => {
      if (index === this._currentVideo) {
        video.visible = true;
        video.currentTime = 0;
        video.play();
      } else {
        video.visible = false;
        video.stop();
      }
    });
  }

  private dismiss(fadeOut: boolean) {
    if (!this._isDismissing) {
      this._isDismissing = true;
      this._fadeOutWhenHiding = fadeOut;
      this.navigator.goTo(AppRoutes.getHome());
    }
  }
}
