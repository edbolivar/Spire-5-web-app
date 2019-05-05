import { Sprite, ticker } from 'pixi.js';
import SimpleSignal from 'simplesignal';

/**
 * An object that continuously loops ("ticks") on every rendering frame, dispatching SimpleSignal calls every time
 * it does so.
 *
 * More information: http://zehfernando.com/2013/a-gamelooper-class-for-actionscript-3-projects/
 *
 * Using GameLooper is similar to creating an ENTER_FRAME event and watching for it, but with these differences:
 *  . Actual "tick" call rate is flexible: it can execute more than one call per frame, or skip frames as needed
 *  . It keeps track of relative time, so it gets passed time and frame data (for correct position calculation)
 *  . Time is flexible, so it can be multiplied/scaled, paused, and resumed
 *
 *
 * How to use:
 *
 * 1. Create a new instance of GameLooper. This will make the looper's onTicked() signal be fired once per frame
 * (same as ENTER_FRAME):
 *
 *     var looper:GameLooper = new GameLooper(); // Create and start
 *
 *     var looper:GameLooper = new GameLooper(true); // Creates and pauses
 *
 * 2. Create function callbacks to receive the signal (signals are like events, but simpler):
 *
 *     looper.onTicked.add(onTick);
 *
 *     private onTick(currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number): void {
 *         var speed: number = 10; // Speed of the box, in pixels per seconds
 *         box.x += speed * tickDeltaTimeSeconds;
 *     }
 *
 *
 * You can also:
 *
 * 1. Pause/resume the looper to pause/resume the game loop:
 *
 *     looper.pause();
 *     looper.resume();
 *
 *
 * 2. Change the time scale to make time go "faster" (currentTimeSeconds, and tickDeltaTimeSeconds):
 *
 *     looper.timeScale = 2; // 2x original speed (faster motion)
 *     looper.timeScale = 0.5; // 0.5x original speed (slower motion)
 *
 * 3. Specify a minimum FPS as a parameter. When the minFPS parameter is used, the looper is always dispatched at
 * least that amount of times per second, regardless of the number of frames:
 *
 *     var looper:GameLooper = new GameLooper(false, 8);
 *
 * In the above example, on a SWF with 4 frames per second, onTicked would be fired twice per frame. On a SWF with
 * 6 frames per second, it would be fired once, and then twice every other frame.
 *
 * 4. Specify a maximum FPS as a parameter. When the maxFPS parameter is used, the looper is not dispatched more
 * that number of times per second:
 *
 *     var looper:GameLooper = new GameLooper(false, NaN, 10);
 *
 * In the above example, on a SWF with 30 frames per second, onTicked would be fired once every 3 frames.
 *
 */

export class GameLooper {
  // Properties
  private _isRunning: boolean;
  private _timeScale: number;
  private _currentTick: number; // Current absolute frame
  private _currentTime: number; // Current absolute time, in ms
  private _tickDeltaTime: number; // Time since last tick, in ms
  private _minFPS: number;
  private _maxFPS: number;

  private lastTimeUpdated: number;
  private minInterval: number; // Min time to wait (in ms) between updates; causes skips (NaN = never enforces)
  private maxInterval: number; // Max time to wait (in ms) between updates; causes repetitions (NaN = never enforces)

  // Temp stuff to reduce garbage collection
  private now: number;
  private frameDeltaTime: number;
  private interval: number;

  private _onResumed: SimpleSignal<any> = new SimpleSignal();
  private _onPaused: SimpleSignal<any> = new SimpleSignal();
  private _onTicked: SimpleSignal<any> = new SimpleSignal(); // Receives: currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number
  private _onTickedOncePerVisualFrame: SimpleSignal<any> = new SimpleSignal(); // Only fired once per frame. Receives: currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  /**
   * Creates a new GameLooper instance.
   *
   * @param paused Starts in paused state if true. Default is false, which means it starts looping right
   *               away.
   *
   * @param minFPS Minimum amount of ticks to dispatch per second. This can cause frames to dispatch more
   *               than one onTicked event. Default is NaN, which means there's no minimum (synchronizes
   *               with ENTER_FRAME).
   *
   * @param maxFPS Maximum amount of ticks to dispatch per second. This can cause frames to skip dispatching
   *               onTicked events. Default is NaN, which means there's no maximum (synchronizes to
   *               ENTER_FRAME).
   */
  constructor(
    __paused: boolean = false,
    __minFPS: number = NaN,
    __maxFPS: number = NaN
  ) {
    this._minFPS = __minFPS;
    this._maxFPS = __maxFPS;
    this._timeScale = 1;
    this._currentTick = 0;
    this._currentTime = 0;
    this._tickDeltaTime = 0;
    this._isRunning = false;

    this.onSpriteEnterFrame = this.onSpriteEnterFrame.bind(this);

    this.maxInterval = isNaN(this._minFPS) ? NaN : 1000 / this._minFPS;
    this.minInterval = isNaN(this._maxFPS) ? NaN : 1000 / this._maxFPS;

    this._onResumed = new SimpleSignal();
    this._onPaused = new SimpleSignal();
    this._onTicked = new SimpleSignal();
    this._onTickedOncePerVisualFrame = new SimpleSignal();

    if (!__paused) {
      this.resume();
    }
  }

  // ================================================================================================================
  // EVENT INTERFACE ------------------------------------------------------------------------------------------------

  private onSpriteEnterFrame(): void {
    this.now = ticker.shared.lastTime;
    this.frameDeltaTime = this.now - this.lastTimeUpdated;

    if (isNaN(this.minInterval) || this.frameDeltaTime >= this.minInterval) {
      if (!isNaN(this.maxInterval)) {
        // Needs several updates
        this.interval = Math.min(this.frameDeltaTime, this.maxInterval);
        while (this.now >= this.lastTimeUpdated + this.interval) {
          this.update(
            this.interval * this._timeScale,
            this.now <= this.lastTimeUpdated + this.maxInterval * 2
          ); // Only dispatches visual frame update on the last call
          this.lastTimeUpdated += this.interval;
        }
      } else {
        // Just a single simple update
        let timePassedMS = this.frameDeltaTime * this._timeScale;
        if (timePassedMS < 0) {
          timePassedMS = 0;
        }

        this.update(timePassedMS, true);
        this.lastTimeUpdated = this.now; // TODO: not perfect? drifting for ~1 frame every 20 seconds or so when minInterval is used
      }
    }
  }

  // ================================================================================================================
  // INTERNAL INTERFACE ---------------------------------------------------------------------------------------------

  private update(
    __timePassedMS: number,
    __newVisualFrame: boolean = true
  ): void {
    this._currentTick++;
    this._currentTime += __timePassedMS;
    this._tickDeltaTime = __timePassedMS;
    this._onTicked.dispatch(
      this.currentTimeSeconds,
      this.tickDeltaTimeSeconds,
      this.currentTick
    );

    if (__newVisualFrame) {
      this._onTickedOncePerVisualFrame.dispatch(
        this.currentTimeSeconds,
        this.tickDeltaTimeSeconds,
        this.currentTick
      );
    }
  }

  private getTimerUInt(): number {
    // A safe getTimer() - runs for ~1192 hours instead of ~596
    const v: number = ticker.shared.lastTime;
    return v < 0
      ? Number.MAX_SAFE_INTEGER + 1 + v - Number.MIN_SAFE_INTEGER
      : v;
  }

  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  public updateOnce(__callback: Function): void {
    __callback(
      this.currentTimeSeconds,
      this.tickDeltaTimeSeconds,
      this.currentTick
    );
  }

  /**
   * Resumes running this instance, if it's in a paused state.
   *
   * <p>Calling this method when this instance is already running has no effect.</p>
   *
   * @see #isRunning
   */
  public resume(): void {
    if (!this._isRunning) {
      this._isRunning = true;

      this.lastTimeUpdated = this.getTimerUInt();

      this._onResumed.dispatch();

      ticker.shared.add(this.onSpriteEnterFrame);
    }
  }

  /**
   * Pauses this instance, if it's in a running state. All time- and tick-related property values are also
   * paused.
   *
   * <p>Calling this method when this instance is already paused has no effect.</p>
   *
   * @see #isRunning
   */
  public pause(): void {
    if (this._isRunning) {
      this._isRunning = false;

      this._onPaused.dispatch();

      ticker.shared.remove(this.onSpriteEnterFrame);
    }
  }

  /**
   * Prepares this instance for disposal, by pausing it and removing all signal callbacks.
   *
   * <p>Calling this method is not strictly necessary, but a good practice unless you're pausing it and
   * clearing all signals manually.</p>
   */
  public dispose(): void {
    this.pause();
    this._onResumed.removeAll();
    this._onPaused.removeAll();
    this._onTicked.removeAll();
  }

  // ================================================================================================================
  // ACCESSOR INTERFACE ---------------------------------------------------------------------------------------------

  /**
   * The index of the tick (an "internal frame") executed last.
   */
  public get currentTick(): number {
    return this._currentTick;
  }

  /**
   * The current internal time of the looper, in seconds. This is aligned to the last tick executed.
   */
  public get currentTimeSeconds(): number {
    return this._currentTime / 1000;
  }

  /**
   * How much time has been spent between the last and the previous tick, in seconds.
   */
  public get tickDeltaTimeSeconds(): number {
    return this._tickDeltaTime / 1000;
  }

  /**
   * The time scale for the internal loop time. Changing this has an impact on the time used by the looper,
   * and can have the effect of make objects that depend on it slower or faster.
   *
   * <p>The actual number of signal callbacks dispatched per second do not change.</p>
   */
  public get timeScale(): number {
    return this._timeScale;
  }

  /**
   * The time scale for the internal loop time. Changing this has an impact on the time used by the looper,
   * and can have the effect of make objects that depend on it slower or faster.
   *
   * <p>The actual number of signal callbacks dispatched per second do not change.</p>
   */
  public set timeScale(__value: number) {
    if (this._timeScale !== __value) {
      this._timeScale = __value;
    }
  }

  /**
   * A signal that sends callbacks for when the looper resumes running. Sends no parameters.
   *
   * <p>Usage:</p>
   *
   * <pre>
   * private myOnResumed(): void {
   *     trace("Looper has resumed");
   * }
   *
   * myGameLooper.onResumed.add(myOnResumed);
   * </pre>
   */
  public get onResumed(): SimpleSignal<any> {
    return this._onResumed;
  }

  /**
   * A signal that sends callbacks for when the looper pauses execution. Sends no parameters.
   *
   * <p>Usage:</p>
   *
   * <pre>
   * private myOnPaused(): void {
   *     trace("Looper has paused");
   * }
   *
   * myGameLooper.onPaused.add(myOnPaused);
   * </pre>
   */
  public get onPaused(): SimpleSignal<any> {
    return this._onPaused;
  }

  /**
   * A signal that sends callbacks for when the looper instance loops (that is, it "ticks"). It sends the
   * current time (absolute and delta, as seconds) and current tick (as an int) as parameters.
   *
   * <p>Usage:</p>
   *
   * <pre>
   * private myOnTicked(currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number): void {
   *     trace("A loop happened.");
   *     trace("Time since it started executing:" + currentTimeSeconds + " seconds");
   *     trace("           Time since last tick:" + tickDeltaTimeSeconds + " seconds");
   *     trace("        Tick/frame count so far:" + currentTick);
   * }
   *
   * myGameLooper.onTicked.add(myOnTicked);
   * </pre>
   */
  public get onTicked(): SimpleSignal<any> {
    return this._onTicked;
  }

  /**
   * A signal that sends callbacks for when the looper instance loops (that is, it "ticks") only once per
   * frame (basically ignoring the <code>minFPS</code> parameter). It sends the current time (absolute and
   * delta, as seconds) and current tick (as an int) as parameters.
   *
   * <p>This is useful when using <code>minFPS</code> because you can use the <code>onTicked</code> callback
   * to do any state changes your game needs, but then only perform visual updates after a
   * <code>onTickedOncePerVisualFrame()</code> call. If you need to enforce a minimum number of frames per
   * second but did all visual updates on <code>onTicked()</code>, you could potentially be repeating useless
   * visual updates.
   *
   * <p>Usage:</p>
   *
   * <pre>
   * private myOnTickedOncePerVisualFrame(currentTimeSeconds: number, tickDeltaTimeSeconds: number, currentTick: number): void {
   *     trace("At least one loop happened in this frame.");
   *     trace("Time since it started executing:" + currentTimeSeconds + " seconds");
   *     trace("           Time since last tick:" + tickDeltaTimeSeconds + " seconds");
   *     trace("        Tick/frame count so far:" + currentTick);
   * }
   *
   * myGameLooper.onTickedOncePerVisualFrame.add(myOnTickedOncePerVisualFrame);
   * </pre>
   */
  public get onTickedOncePerVisualFrame(): SimpleSignal<any> {
    return this._onTickedOncePerVisualFrame;
  }

  /**
   * Returns <code>true</code> if the GameLooper instance is running, <code>false</code> if it is paused.
   *
   * @see #pause()
   * @see #resume()
   */
  public get isRunning(): boolean {
    return this._isRunning;
  }
}

export const SharedGameLooper = new GameLooper();
