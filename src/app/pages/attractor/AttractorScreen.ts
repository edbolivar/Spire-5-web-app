import AbstractScreen from '../../display/navigation/AbstractScreen';
import VideoPlayer from '../../display/components/VideoPlayer';
import Box from '../../display/shapes/Box';
import LayoutUtils from '../../utils/LayoutUtils';
import AppRoutes from '../../display/navigation/AppRoutes';
import { AppInfoService } from '../../services/app-info.service';
import { IdleState } from '../../universal/app.types';
import { JsUtil } from '../../universal/JsUtil';
import { SubscribeEvent, PubSubTopic } from '../../universal/pub-sub-types';
import Easing from '../../../transitions/Easing';
import { map } from 'moremath';
import { IdleToHomeTransition } from '../../display/navigation/IdleToHomeTransition';

export default class AttractorScreen extends AbstractScreen {
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

    SubscribeEvent.Create(PubSubTopic.idleStateChanged, this.objectId)
      .HandleEventWithThisMethod(e => this.onIdleStateChanged(e.data))
      .Done();
  }

  onIdleStateChanged(e: IdleState) {
    console.log('AttractorScreen got idlestate', e);
    this._idleState = e;
  }

  public prepareToShow(): Promise<void> {
    return new Promise(resolve => {
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

      this.alpha = 0;
      this.visible = true;

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

  public async show(previousRoute?: string) {
    this.playVideo(0);
  }

  public async transition(transitionInfluence: number) {
    if (this.navigator.transition.type === 'Idle') {
      this.alpha = Easing.quadOut(map(transitionInfluence, 0, 0.3, 0, 1, true));
      return;
    }

    if (this.navigator.transition.type === 'IdleToHome') {
      this.alpha = 0;
    }
  }

  public destroy() {
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);

    this._videos.forEach(video => {
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
    return this._videos.every(video => video.isLoaded);
  }

  private resizeAllVideos() {
    // Resize all videos to fit within the viewport rectangle
    const viewport = {
      x: 0,
      y: 0,
      width: this.Platform.width,
      height: this.Platform.height
    };

    for (const video of this._videos) {
      const videoSize = {
        width: video.intrinsicWidth,
        height: video.intrinsicHeight
      };
      const videoRect = LayoutUtils.fitInsideRectangle(
        videoSize,
        viewport,
        true
      );
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
      this.navigator.goTo(
        AppRoutes.getHome(),
        null,
        new IdleToHomeTransition()
      );
    }
  }
}
