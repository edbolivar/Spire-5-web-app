import {clamp, map} from 'moremath';
import {Sprite, ticker} from 'pixi.js';
import VideoPlayer from '../../display/components/VideoPlayer';
import Easing from '../../../transitions/Easing';
import {JsUtil} from '../../universal/JsUtil';

export default class LiquidVideo extends Sprite {
  objectId: number;
  private _videos: VideoPlayer[];
  private _currentVideo: number;
  private _poured: number;
  private _pouredTarget: number;
  private _container: Sprite;

  private __width: number;
  private __height: number;

  constructor(videoAssets: string[]) {
    super();
    this.objectId = JsUtil.getObjectId();
    this.__width = 100;
    this.__height = 100;
    this._poured = this._pouredTarget = 0;

    this._videos = [];

    this._container = new Sprite();
    this.addChild(this._container);

    // Load all videos
    for (const videoFile of videoAssets) {
      const video = new VideoPlayer(videoFile);
      video.loop = false;
      video.visible = false;
      video.pause();
      video.onEnded.add(this.onVideoEnded.bind(this));
      this._container.addChild(video);
      this._videos.push(video);
    }

    this.resizeAllVideos();
    this.redrawPoured();

    // Start animation
    this.onTick = this.onTick.bind(this);
    ticker.shared.add(this.onTick);
  }

  public get width() {
    return this.__width;
  }

  public set width(width: number) {
    this.__width = width;
    this.resizeAllVideos();
  }

  public get height() {
    return this.__height;
  }

  public set height(height: number) {
    this.__height = height;
    this.resizeAllVideos();
    this.redrawPoured();
  }

  public get pouredTarget() { 
    return this._pouredTarget;
  }

  public set pouredTarget(pouredTarget: number) {
    this._pouredTarget = pouredTarget;
  }

  public prepare(): Promise<void> {
    return new Promise((resolve) => {
      if (this._videos[0].isLoaded) {
        resolve();
      } else {
        this._videos[0].onLoaded.add(() => {
          resolve();
        });
      }
    });
  }

  public play() {
    this.playVideo(0);
  }

  public destroy() {
    console.log('destroy.LiquidVideo');
    ticker.shared.remove(this.onTick);
    this._videos.forEach((video, index) => {
      video.destroy();
    });
    this._videos = [];
    this._container.destroy();
    super.destroy();
  }

  private onTick(delta: number) {
    if (this._poured !== this._pouredTarget) {
      const change = this._pouredTarget > this._poured ? 1 : -1;
      this._poured = clamp(this._poured + change * delta * 0.005);
      this.redrawPoured();
    }
  }

  private onVideoEnded(video: VideoPlayer) {
    const videoIndex = this._videos.indexOf(video);
    if (videoIndex === this._currentVideo) {
      if (videoIndex === this._videos.length - 1) {
        // Finished last video, loop it
        this.loopVideo(video);
      } else {
        // Play next video
        this.playVideo(videoIndex + 1);
      }
    }
  }

  private loopVideo(video: VideoPlayer) {
    video.visible = true;
    video.currentTime = 0;
    video.loop = true;
    video.play();
  }

  private playVideo(videoIndex: number) {

    this._currentVideo = videoIndex;

    this._videos.forEach((video, index) => {
      if (index === this._currentVideo) {
          video.visible = true;
          video.play();
          video.currentTime = 0;
      } else {
          video.visible = false;
          video.stop();
      }
    });
  }

  private resizeAllVideos() {
    for (const video of this._videos) {
      video.x = 0;
      video.y = 0;
      video.width = this.__width;
      video.height = this.__height;
    }
  }

  private redrawPoured() {
    this._container.y = map(Easing.sineInOut(this._poured), 0, 1, 1, this.__height * 0.3);
  }
}
