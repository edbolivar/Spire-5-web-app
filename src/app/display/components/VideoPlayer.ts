import {Sprite, Texture} from 'pixi.js';
import SimpleSignal from 'simplesignal';

export default class VideoPlayer extends Sprite {

  private _videoTexture: Texture;
  private _videoSprite: Sprite;

  private _isPlaying: boolean;
  private _isLoaded: boolean;

  private _onEnded = new SimpleSignal<(videoPlayer: VideoPlayer) => void>();
  private _onLoaded = new SimpleSignal<(videoPlayer: VideoPlayer) => void>();

  constructor(source: string) {
    super();

    // Binds
    this.onTextureLoaded = this.onTextureLoaded.bind(this);
    this.onTextureLoadError = this.onTextureLoadError.bind(this);
    this.onVideoEnded = this.onVideoEnded.bind(this);

    // Internal settings
    this._isPlaying = true;
    this._isLoaded = false;

    // Create instances
    this._videoTexture = Texture.fromVideo(source);
    this._videoSprite = new Sprite(this._videoTexture);
    this.addChild(this._videoSprite);

    // Events
    this._videoTexture.baseTexture.on('loaded', this.onTextureLoaded);
    this._videoTexture.baseTexture.on('error', this.onTextureLoadError);

    // Basic settings
    this.width = 0;
    this.height = 0;
    this.loop = true;
    this.muted = false;
  }

  public get width() {
    return this._videoSprite.width;
  }

  public set width(width: number) {
    this._videoSprite.width = width;
  }

  public get height() {
    return this._videoSprite.height;
  }

  public set height(height: number) {
    this._videoSprite.height = height;
  }

  public get intrinsicWidth() {
    return this.getVideo().videoWidth;
  }

  public get intrinsicHeight() {
    return this.getVideo().videoHeight;
  }

  public get isLoaded() {
    return this._isLoaded;
  }

  public get loop() {
    return this.getVideo().loop;
  }

  public set loop(loop: boolean) {
    this.getVideo().loop = loop;
  }

  public get muted() {
    return this.getVideo().muted;
  }

  public set muted(muted: boolean) {
    this.getVideo().muted = muted;
  }

  public get currentTime() {
    return this.getVideo().currentTime;
  }

  public set currentTime(currentTime: number) {
    this.getVideo().currentTime = currentTime;
  }

  public get onLoaded() {
    return this._onLoaded;
  }

  public get onEnded() {
    return this._onEnded;
  }

  public get isPlaying() {
    return this._isPlaying;
  }

  public play() {
    this._isPlaying = true;
    this.getVideo().autoplay = true;
    this.getVideo().play();
  }

  public stop() {
    this.pause();
    this.getVideo().currentTime = 0;
  }

  public pause() {
    this._isPlaying = false;
    this.getVideo().autoplay = false;
    this.getVideo().pause();
  }

  public destroy() {
    this.getVideo().removeEventListener('ended', this.onVideoEnded);
    this._onLoaded.removeAll();
    this._onEnded.removeAll();
    this._videoTexture.destroy();
    this._videoSprite.destroy();
    super.destroy();
  }

  private onTextureLoaded() {
    // Create events
    this.getVideo().addEventListener('ended', this.onVideoEnded);
    this._isLoaded = true;

    this._onLoaded.dispatch(this);

    if (this.width === 0) this.width = this.intrinsicWidth;
    if (this.height === 0) this.height = this.intrinsicHeight;

    // Play or pause
    if (this._isPlaying) {
      this.play();
    } else {
      this.stop();
    }

    // Perform play/pause it again because PIXI forces playback
    requestAnimationFrame(() => {
      if (this._isPlaying) {
        this.play();
      } else {
        this.stop();
      }
    });
  }

  private onTextureLoadError(e: any) {
    console.error('Error loading video texture:', e);
  }

  private onVideoEnded() {
    this._onEnded.dispatch(this);
  }

  private getVideo() {
    return this._videoTexture.baseTexture.source as HTMLVideoElement;
  }
}
