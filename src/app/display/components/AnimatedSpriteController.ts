import { Sprite, Texture, ticker, PointLike } from 'pixi.js';
import SimpleSignal from 'simplesignal';
import { AnimationDefinition } from '../../data/types/AnimationDefinition';

export default class AnimatedSpriteController {
  private _originalX: number;
  private _originalY: number;
  private _width: number;
  private _height: number;
  private _frames: number;
  private _fps: number;
  private _frame: number;
  private _loop: boolean;

  private _texture: Texture;
  private _sprite: Sprite;

  private _isPlaying: boolean;
  private _isLoaded: boolean;

  private _animationDefinition: AnimationDefinition;

  private _onLoaded = new SimpleSignal<
    (sprite: AnimatedSpriteController) => void
  >();
  
  public onFinishedPlaying = new SimpleSignal<
    (sprite: AnimatedSpriteController) => void
  >();

  constructor(
    animationDefinition: AnimationDefinition
  ) {
    this.onTick = this.onTick.bind(this);
    this.onTextureLoaded = this.onTextureLoaded.bind(this);
    this.onTextureLoadError = this.onTextureLoadError.bind(this);

    // Set data
    this._animationDefinition = animationDefinition;
    this.set(
      animationDefinition.image,
      animationDefinition.frameWidth,
      animationDefinition.frameHeight,
      animationDefinition.frames,
      animationDefinition.fps,
      animationDefinition.scale
    );

    // Internal settings
    this._frame = 0;
    this._loop = true;
    this._isPlaying = false;
    this._isLoaded = false;
  }

  public set(
    imageAsset: string,
    width: number,
    height: number,
    frames: number,
    fps: number,
    scale: number = 1
  ) {
    // Create instances
    this.unset();

    if (imageAsset) {
      this._width = width;
      this._height = height;
      this._frames = frames;
      this._fps = fps;

      this._texture = Texture.fromImage(imageAsset).clone();
      this._sprite = new Sprite(this._texture);
      this._sprite.scale.set(scale, scale);
      this._sprite.anchor.set(0.5, 0.5);
      this._sprite.position.set(0, 0);

      this.setFrame(0, true);

      // Events
      this._texture.baseTexture.on('loaded', this.onTextureLoaded);
      this._texture.baseTexture.on('error', this.onTextureLoadError);
    }
  }

  public set parent(parent: Sprite) {
    if (parent) {
      parent.addChild(this._sprite);
    } else {
      this._sprite.parent.removeChild(this._sprite);
    }
  }

  public get animationDefinition() {
    return this._animationDefinition;
  }
  
  public get sprite() {
    return this._sprite;
  }

  public unset() {
    if (this._texture) {
      this._texture.destroy();
      this._sprite.destroy();
    }
    this._onLoaded.removeAll();
  }

  public isPlaying() {
    return this._isPlaying;
  }

  public get fps() {
    return this._fps;
  }

  public set fps(fps: number) {
    this._fps = fps;
  }

  public get originalX() {
    return this._originalX;
  }

  public set originalX(x: number) {
    this._originalX = x;
    this._sprite.x = x;
  }

  public get originalY() {
    return this._originalY;
  }

  public set originalY(y: number) {
    this._originalY = y;
    this._sprite.y = y;
  }
  
  public get loop() {
    return this._loop;
  }

  public set loop(loop: boolean) {
    this._loop = loop;
  }

  public get width() {
    return this._width * this.sprite.scale.x;
  }

  public set width(width: number) {
    this.sprite.scale.x = width / this._width;
  }

  public get height() {
    return this._height * this.sprite.scale.y;
  }

  public set height(height: number) {
    this.sprite.scale.y = height / this._height;
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
  }

  private onTick() {
    const frameTime = ticker.shared.elapsedMS;
    const newFrame =
      (isNaN(this._frame) ? 0 : this._frame) + this._fps / (1000 / frameTime);
    if (newFrame >= this._frames - 1 && !this._loop) {
      // Last frame and not looping, set and stop      
      this.setFrame(this._frames - 1);
      this.pause();

      this.onFinishedPlaying.dispatch(this);
    } else {
      // Normal loop, set and continue playing
      this.setFrame(newFrame % this._frames);
    }
  }

  public reset() {
    this._frame = 0;
  }

  public moveToNextFrame() {
    if (this._frame < this._frames - 1) {
      const cols = Math.floor(this._texture.baseTexture.width / this._width);
      const nextFrame = this._frame + 1;
      const col = nextFrame % cols;
      const row = Math.floor(nextFrame / cols);
      this.redrawNextFrame(col, row);
      this._frame = nextFrame;
      this._isPlaying = true;
    } else {
      this._isPlaying = false;
      this.redrawNextFrame(1, 0);
      if (this.loop) {
        this._frame = 0;
      }
      this._sprite.emit('animationComplete');
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

  public getFrame() {
    return this._frame;
  }

  public getFrameCount() {
    return this._frames;
  }

  public get totalFrames() {
    return this._frames;
  }

  public get frame() {
    return this._frame;
  }

  public set frame(value: number) {
    this.setFrame(value);
  }

  private redrawNextFrame(col: number, row: number) {
    if (this._texture && this._texture.baseTexture) {
      this._texture.frame.x = col * this._width;
      this._texture.frame.y = row * this._height;
      this._texture.frame.width = this._width;
      this._texture.frame.height = this._height;
      this._texture._updateUvs();
    }
  }

  private redrawFrame() {
    if (this._texture && this._texture.baseTexture) {
      const frame = Math.floor(this._frame);
      const cols = Math.floor(this._texture.baseTexture.width / this._width);
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      this._texture.frame.x = col * this._width;
      this._texture.frame.y = row * this._height;
      this._texture.frame.width = this._width;
      this._texture.frame.height = this._height;
      this._texture._updateUvs();
    }
  }
}
