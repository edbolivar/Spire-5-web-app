import { Sprite, Texture, ticker } from 'pixi.js';
import SimpleSignal from 'simplesignal';
import {Bubbles} from '../../universal/app.types';


export default class LegacyAnimatedSprite extends Sprite {

  private __width: number;
  private __height: number;
  private _frames: number;
  private _fps: number;
  private _scale: number;
  private _frame: number;
  private _loop: boolean;

  private __texture: Texture;
  private _sprite: Sprite;

  private _isPlaying: boolean;
  private _isLoaded: boolean;

  private _onLoaded = new SimpleSignal<(sprite: LegacyAnimatedSprite) => void>();


  constructor(imageAsset: string, width: number, height: number, frames: number, fps: number, scale: number = 1) {
    super();

    // Binds
    this.onTick = this.onTick.bind(this);
    this.onTextureLoaded = this.onTextureLoaded.bind(this);
    this.onTextureLoadError = this.onTextureLoadError.bind(this);

    // Set data
    this.set(imageAsset, width, height, frames, fps, scale);

    // Internal settings
    this._frame = 0;
    this._loop = true;
    this._isPlaying = false;
    this._isLoaded = false;
  }

  public static Create(bubbleSpec: Bubbles) {
    const newSprite = new LegacyAnimatedSprite('', 0, 0, 0, 0);
    newSprite.set(bubbleSpec.asset, bubbleSpec.width, bubbleSpec.height, bubbleSpec.frames, bubbleSpec.fps, bubbleSpec.scale);

    return newSprite;
  }

  public set(imageAsset: string, width: number, height: number, frames: number, fps: number, scale: number = 1) {
    // Create instances
    this.unset();
    if (imageAsset) {
      this.__width = width;
      this.__height = height;
      this._frames = frames;
      this._fps = fps;
      this._scale = scale;

      this.__texture = Texture.fromImage(imageAsset);
      this._sprite = new Sprite(this.__texture);
      this._sprite.position.set(-this.__width * 0.5, -this.__height * 0.5);
      this.addChild(this._sprite);

      this.setFrame(0, true);

      // Events
      this.__texture.baseTexture.on('loaded', this.onTextureLoaded);
      this.__texture.baseTexture.on('error', this.onTextureLoadError);
    }
  }

  public unset() {
    if (this.__texture) {
      this.__texture.destroy();
      this._sprite.destroy();
    }
    this._onLoaded.removeAll();
  }

  public get loop() {
    return this._loop;
  }

  public set loop(loop: boolean) {
    this._loop = loop;
  }

  public get width() {
    return this.__width * this._scale;
  }

  public set width(width: number) {
    this._scale = width / this.__width;
  }

  public get height() {
    return this.__height * this._scale;
  }

  public set height(height: number) {
    this._scale = height / this.__height;
  }

  public get isLoaded() {
    return this._isLoaded;
  }

  public play() {
    if (!this._isPlaying) {
      this._isPlaying = true;
      if (this._frame >= this._frames - 1) {
        this.setFrame(0);
      }
      ticker.shared.add(this.onTick);
    }
  }

  public stop() {
    this.pause();
    this.setFrame(0);
  }

  public pause() {
    if (this._isPlaying) {
      this._isPlaying = false;
      ticker.shared.remove(this.onTick);
    }
  }

  public destroy() {
    this.stop();
    this.unset();
    super.destroy();
  }

  private onTick() {
    const frameTime = ticker.shared.elapsedMS;
    const newFrame = (isNaN(this._frame) ? 0 : this._frame) + this._fps / (1000 / frameTime);
    if (newFrame >= this._frames - 1 && !this._loop) {
      // Last frame and not looping, set and stop
      this.setFrame(this._frames - 1);
      this.pause();
    } else {
      // Normal loop, set and continue playing
      this.setFrame(newFrame % this._frames);
    }
  }

  private onTextureLoaded() {
    // Create events
    this._isLoaded = true;
    this.setFrame(0, true);
    this._onLoaded.dispatch(this);
  }

  private onTextureLoadError(e: any) {
    console.error('Error loading texture:', e);
  }

  private setFrame(frame: number, forced: boolean = false) {
    const oldFrame = Math.floor(this._frame);
    this._frame = frame;
    const newFrame = Math.floor(this._frame);
    if (newFrame !== oldFrame || forced) {
      this.redrawFrame();
    }
  }

  private redrawFrame() {
    if (this.__texture && this.__texture.baseTexture) {
      const frame = Math.floor(this._frame);
      const cols = Math.floor(this.__texture.baseTexture.width / this.__width);
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      this.__texture.frame.x = col * this.__width;
      this.__texture.frame.y = row * this.__height;
      this.__texture.frame.width = this.__width;
      this.__texture.frame.height = this.__height;
      this.__texture._updateUvs();
    }
  }
}
