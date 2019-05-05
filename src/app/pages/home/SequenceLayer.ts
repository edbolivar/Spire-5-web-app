import { Sprite, Point, Rectangle, filters, Graphics } from 'pixi.js';
import BrandBlobButton from './BrandBlobButton';
import {
  SequenceItemDefinition,
  SequenceItemDefinitions
} from '../../data/types/SequenceItemDefinition';
import {
  polar,
  distance,
  originDistance,
  addPoints
} from '../../utils/PointUtils';
import { map } from 'moremath';
import { getTimer } from '../../utils/getTimer';
import {
  MetaballItemDefinition,
  MetaballItemDefinitions
} from '../../data/types/MetaballItemDefinition';
import RandomGenerator from '../../utils/RandomGenerator';
import { MathUtils } from '../../utils/MathUtils';
import { Color } from '../../data/types/Color';
import AnimatedSpriteController from '../../display/components/AnimatedSpriteController';
import Box from '../../display/shapes/Box';

export default class SequenceLayer extends Sprite {
  static TIME_WAIT_BETWEEN_SEQUENCES: number = 3; // Time, in seconds, to wait between each sequence animation
  static NUM_MAPPED_PHASE_POINTS: number = 50; // Precision for phase remapping... the more the better
  static METABALLS_RADIUS_SCALE: number = 0.66;
  static SHOW_DEBUG: boolean = false;

  private _isPlaying: boolean;
  private _visibility: number = 1;
  private _buttons: BrandBlobButton[];
  private _timeToPlayNextSequence: number;
  private _lastMeasuredTime: number;
  private _topBlobSpritesInfo: BrandBlobButton;
  private _lastSequenceAnimationPlayed: string;
  private _lastSequenceAnimationTried: string;
  private _sequenceScaleX: number;
  private _sequenceScaleY: number;
  private _timeCurrentSequenceStartedPlaying: number; // In ms
  private _timeCurrentSequenceDuration: number; // In ms

  private _scale: number;
  private _mappedPhase: number[]; // Re-mapped phase (sequences of 0-1) to take speed into consideration
  private _mappedHeights: number[]; // Re-mapped heights for proper curves

  private _startTarget: BrandBlobButton;
  private _startMetaballsPlayer: AnimatedSpriteController;
  private _startMetaballDefinition: MetaballItemDefinition;
  private _startRotation: number;
  private _startAngle: number;
  private _startAnglePoint: Point;
  private _endTarget: BrandBlobButton;
  private _endMetaballsPlayer: AnimatedSpriteController;
  private _endMetaballDefinition: MetaballItemDefinition;
  private _endRotation: number;
  private _endAngle: number;
  private _endAnglePoint: Point;
  private _animationArea: Rectangle;

  private _layerMetaballs: Sprite;
  private _layerAnimation: Sprite;
  private _layerUnderAnimation: Sprite;
  private _layerAboveAnimation: Sprite;

  private _sequencePlayer: AnimatedSpriteController;
  private _sequenceFilter = new filters.ColorMatrixFilter();
  private _startMetaballsFilter = new filters.ColorMatrixFilter();
  private _endMetaballsFilter = new filters.ColorMatrixFilter();
  private _currentSequenceDefinition: SequenceItemDefinition;

  private _debug_sequencePathShape: Graphics;

  constructor(
    __buttons: BrandBlobButton[],
    __scale: number,
    __animationArea: Rectangle
  ) {
    super();

    this._buttons = __buttons;
    this._scale = __scale;
    this._animationArea = __animationArea;

    this.onFinishedPlayingMetaballs = this.onFinishedPlayingMetaballs.bind(
      this
    );

    this._layerMetaballs = new Sprite();
    this._layerMetaballs.interactive = false;
    this.addChild(this._layerMetaballs);

    this._layerUnderAnimation = new Sprite();
    this.addChild(this._layerUnderAnimation);

    this._layerAnimation = new Sprite();
    this.addChild(this._layerAnimation);
    
    this._layerAboveAnimation = new Sprite();
    this.addChild(this._layerAboveAnimation);
    
    if (SequenceLayer.SHOW_DEBUG) {
      const fadeBox = new Box(0xffffff, __animationArea.width, __animationArea.height);
      fadeBox.alpha = 0.7;
      fadeBox.position.set(__animationArea.left, __animationArea.top);
      this.addChild(fadeBox);

      this._debug_sequencePathShape = new Graphics();
      this._debug_sequencePathShape.scale.set(1, 1);
      this._debug_sequencePathShape.alpha = 0.7;
      this.addChild(this._debug_sequencePathShape);
    }
  }

  public get visibility() {
    return this._visibility;
  }

  public set visibility(visibility: number) {
    if (visibility !== this._visibility) {
      this._visibility = visibility;
      this.redrawVisibility();
    }
  }

  public destroy() {
    super.destroy();
  }

  private redrawVisibility() {}

  public start() {
    if (!this._isPlaying) {
      console.log('starting sequence');
      this.queueNextSequence();
      this._isPlaying = true;
    }
  }

  public stop() {
    // Destroy current sequence and stop everything
    if (this._isPlaying) {
      console.log('stopping sequence');

      this._isPlaying = false;
      this.stopQueueingNextSequence();

      this._currentSequenceDefinition = null;

      this.destroyCurrentSequencePlayer();

      if (this._startTarget) {
        this._startTarget.addChildrenToSprite();
        this._startTarget.cancelImpact();
        this._startTarget = null;
      }

      if (this._endTarget) {
        this._endTarget.addChildrenToSprite();
        this._endTarget.cancelImpact();
        this._endTarget = null;
      }

      if (this._startMetaballsPlayer != null) {
        this.removeMetaballPlayer(this._startMetaballsPlayer);
      }

      if (this._endMetaballsPlayer != null) {
        this.removeMetaballPlayer(this._endMetaballsPlayer);
      }
    }
  }

  public update(
    currentTimeSeconds: number,
    tickDeltaTimeSeconds: number,
    currentTick: number
  ) {
    this._lastMeasuredTime = currentTimeSeconds;

    if (
      this._timeToPlayNextSequence > 0 &&
      this._timeToPlayNextSequence < currentTimeSeconds
    ) {
      // Create a new sequence
      this.playNextSequence();
    }

    if (this._sequencePlayer != null) {
      // For the sequence to start playing, the sequence, the metaballs intro, and the metaballs outro need to be created and loaded
      // That's done once per frame, to reduce the performance impact; but it also means it has this deep check

      if (this._timeCurrentSequenceStartedPlaying === 0) {
        // Still waiting for the animation to be loaded
        if (this._sequencePlayer != null) {
          // Sequence has loaded
          if (
            this._startMetaballsPlayer == null &&
            this._currentSequenceDefinition.playMetaballsStart
          ) {
            // No start metaballs yet, and they're needed
            this._startMetaballsPlayer = new AnimatedSpriteController(
              this._startMetaballDefinition.animation
            );
            this._startMetaballsPlayer.loop = false;

            this._startMetaballsPlayer.sprite.anchor.set(
              this._startMetaballDefinition.centerX,
              this._startMetaballDefinition.centerY
            );
            this._startMetaballsPlayer.sprite.rotation =
              0 -
              this._startMetaballDefinition.angle * MathUtils.DEG2RAD +
              Math.atan2(this._startAnglePoint.y, this._startAnglePoint.x);
            this._startMetaballsPlayer.sprite.visible = false;
            const scale =
              this._startTarget.nodeInfo.scale *
              this._startMetaballDefinition.scale;
            this._startMetaballsPlayer.sprite.scale.set(scale, scale);

            this._startMetaballsPlayer.play();
            this._startMetaballsPlayer.pause();

            this._startMetaballsFilter.matrix = this.getColorMatrix(
              Color.fromString(
                this._startTarget.pourable.design.colors.animationDark
              ),
              Color.fromString(
                this._startTarget.pourable.design.colors.animationLight
              )
            );

            this._startMetaballsPlayer.sprite.filters = [
              this._startMetaballsFilter
            ];
            this._startMetaballsPlayer.onFinishedPlaying.add(
              this.onFinishedPlayingMetaballs
            );

            this._startMetaballsPlayer.parent = this._layerMetaballs;
          } else if (
            (this._startMetaballsPlayer != null &&
              this._startMetaballsPlayer != null) ||
            !this._currentSequenceDefinition.playMetaballsStart
          ) {
            // Starting metaballs sequence has loaded, or no starting metaballs are needed
            if (
              this._endMetaballsPlayer == null &&
              this._currentSequenceDefinition.playMetaballsEnd
            ) {
              // No end metaballs yet, and they're needed
              this._endMetaballsPlayer = new AnimatedSpriteController(
                this._endMetaballDefinition.animation
              );
              this._endMetaballsPlayer.loop = false;

              this._endMetaballsPlayer.sprite.anchor.set(
                this._endMetaballDefinition.centerX,
                this._endMetaballDefinition.centerY
              );
              this._endMetaballsPlayer.sprite.rotation =
                0 -
                this._endMetaballDefinition.angle * MathUtils.DEG2RAD +
                Math.atan2(this._endAnglePoint.y, this._endAnglePoint.x);

              this._endMetaballsPlayer.sprite.visible = false;
              const scale =
                this._endTarget.nodeInfo.scale *
                this._endMetaballDefinition.scale;

              this._endMetaballsPlayer.sprite.scale.set(scale, scale);
              this._endMetaballsPlayer.play();
              this._endMetaballsPlayer.pause();

              this._endMetaballsFilter.matrix = this.getColorMatrix(
                Color.fromString(
                  this._endTarget.pourable.design.colors.animationDark
                ),
                Color.fromString(
                  this._endTarget.pourable.design.colors.animationLight
                )
              );

              this._endMetaballsPlayer.sprite.filters = [
                this._endMetaballsFilter
              ];
              this._endMetaballsPlayer.onFinishedPlaying.add(
                this.onFinishedPlayingMetaballs
              );

              this._endMetaballsPlayer.parent = this._layerMetaballs;
            } else if (
              (this._endMetaballsPlayer != null &&
                this._endMetaballsPlayer != null) ||
              !this._currentSequenceDefinition.playMetaballsEnd
            ) {
              // Ending metaballs sequence has loaded, or no ending metaballs are needed

              // All loaded, can start playing

              // Set time and start
              this._timeCurrentSequenceStartedPlaying =
                this._lastMeasuredTime * 1000;
              this._timeCurrentSequenceDuration = Math.round(
                (this._sequencePlayer.animationDefinition.frames /
                  this._sequencePlayer.animationDefinition.fps) *
                  1000
              );
              this._sequencePlayer.sprite.visible = true;

              if (this._currentSequenceDefinition.playMetaballsStart) {
                // Play start metaballs
                this._startMetaballsPlayer.sprite.visible = true;
                this._startMetaballsPlayer.stop();
                this._startMetaballsPlayer.play();

                // Play impact

                if (this._currentSequenceDefinition.startImpact > 0) {
                  this._startTarget.setImpact(
                    this._startAngle + Math.PI,
                    this._currentSequenceDefinition.startImpact
                  );
                }
              }
            }
          } else {
            console.log('Reached an unexpected line in SequenceLayer.update');
          }
        }
      }

      if (this._timeCurrentSequenceStartedPlaying > 0) {
        // Playing, update the state of the current sequence

        const linearPhase: number = map(
          this._lastMeasuredTime * 1000 -
            this._timeCurrentSequenceStartedPlaying,
          0,
          this._timeCurrentSequenceDuration,
          0,
          1,
          true
        );

        const mappedPhase: number = this.getSpeedRemappedPhase(linearPhase);

        if (
          this._lastMeasuredTime * 1000 >
          this._timeCurrentSequenceStartedPlaying +
            this._timeCurrentSequenceDuration
        ) {
          // Finished playing the animation, remove it

          if (this._startTarget != null) {
            this._startTarget.addChildrenToSprite();
          }

          console.log('finished playing');
          if (
            this._currentSequenceDefinition.playMetaballsEnd &&
            this._endMetaballsPlayer != null
          ) {
            // Play end metaballs
            console.log('play end metaballs');
            this._endMetaballsPlayer.sprite.visible = true;
            this._endMetaballsPlayer.stop();
            this._endMetaballsPlayer.play();
          } else {
            if (this._endTarget != null) {
              this._endTarget.addChildrenToSprite();
            }
          }

          // Play impact

          if (this._currentSequenceDefinition.endImpact > 0) {
            this._endTarget.setImpact(
              this._endAngle + Math.PI,
              this._currentSequenceDefinition.endImpact
            );
          }

          this._currentSequenceDefinition = null;
          this.destroyCurrentSequencePlayer();
          this.queueNextSequence();
        } else {
          // Still playing the animation, update
          if (this._currentSequenceDefinition == null) {
            console.error(
              'ERROR: Current sequence definition does not exist anymore'
            );
            return;
          }

          let p1: Point, p2: Point;

          if (this._startTarget === this._endTarget) {
            // Same blob

            // Find target position
            p1 = p2 = addPoints(
              this._startTarget.position,
              this._startAnglePoint
            );
          } else {
            // Moving from one blob to another

            // Find target position
            p1 = addPoints(this._startTarget.position, this._startAnglePoint);
            p2 = addPoints(this._endTarget.position, this._endAnglePoint);

            // Set color
            if (this._currentSequenceDefinition.tinted) {
              this.setSequenceFilter(
                Color.interpolateHSV(
                  Color.fromString(
                    this._startTarget.pourable.design.colors.animationDark
                  ),
                  Color.fromString(
                    this._endTarget.pourable.design.colors.animationDark
                  ),
                  1 - mappedPhase
                ),
                Color.interpolateHSV(
                  Color.fromString(
                    this._startTarget.pourable.design.colors.animationLight
                  ),
                  Color.fromString(
                    this._endTarget.pourable.design.colors.animationLight
                  ),
                  1 - mappedPhase
                )
              );
            }
          }

          // Set rotation
          this._sequencePlayer.sprite.rotation = map(
            mappedPhase,
            0,
            1,
            this._startRotation,
            this._endRotation
          );

          // Set blobs that are in front
          if (mappedPhase < 0.5) {
            if (
              this._topBlobSpritesInfo !== this._startTarget &&
              !this._currentSequenceDefinition.aboveTarget
            ) {
              this.setTopBlobSpritesInfo(this._startTarget);
            }
          } else {
            if (
              this._topBlobSpritesInfo !== this._endTarget &&
              !this._currentSequenceDefinition.aboveTarget
            ) {
              this.setTopBlobSpritesInfo(this._endTarget);
            }
          }

          // Set scale
          const s: number = this.getSplineInterpolationPosition(
            this._currentSequenceDefinition.scales,
            mappedPhase
          );
          this._sequencePlayer.sprite.scale.set(
            this._sequenceScaleX * s,
            this._sequenceScaleY * s
          );

          (window as any).sp = this._sequencePlayer;

          this.createMappedHeights(p1, p2);

          // Set position
          const pp: Point = new Point(
            map(mappedPhase, 0, 1, 0, p2.x - p1.x),
            this.getSplineInterpolationPosition(
              this._mappedHeights,
              mappedPhase
            ) - p1.y
          );

          const pp2: Point = polar(
            originDistance(pp),
            Math.atan2(pp.y, pp.x) +
              map(mappedPhase, 0, 1, this._startAngle, this._endAngle) +
              Math.PI * 0.5
          );

          this._sequencePlayer.originalX = p1.x + pp2.x;
          this._sequencePlayer.originalY = p1.y + pp2.y;

          // Set animation frame
          if (this._sequencePlayer != null) {
            this._sequencePlayer.frame = Math.round(
              map(
                linearPhase,
                0,
                1,
                0,
                this._sequencePlayer.totalFrames - 1,
                true
              )
            );
          }
        }
      }
    }

    // Update metaballs
    // This is done outside of the main loop because metaballs can exist after the sequence has already been destroyed
    if (
      this._startMetaballsPlayer != null &&
      this._startTarget != null &&
      this._startMetaballsPlayer.sprite.visible
    ) {
      this._startMetaballsPlayer.originalX =
        this._startTarget.position.x +
        this._startAnglePoint.x * SequenceLayer.METABALLS_RADIUS_SCALE;
      this._startMetaballsPlayer.originalY =
        this._startTarget.position.y +
        this._startAnglePoint.y * SequenceLayer.METABALLS_RADIUS_SCALE;
    }

    if (
      this._endMetaballsPlayer != null &&
      this._endTarget != null &&
      this._endMetaballsPlayer.sprite.visible
    ) {
      this._endMetaballsPlayer.originalX =
        this._endTarget.position.x +
        this._endAnglePoint.x * SequenceLayer.METABALLS_RADIUS_SCALE;
      this._endMetaballsPlayer.originalY =
        this._endTarget.position.y +
        this._endAnglePoint.y * SequenceLayer.METABALLS_RADIUS_SCALE;
    }
  }

  private onFinishedPlayingMetaballs(player: AnimatedSpriteController) {
    player.onFinishedPlaying.remove(this.onFinishedPlayingMetaballs);

    if (player === this._startMetaballsPlayer) {
      this._startMetaballsPlayer = null;
    }

    if (player === this._endMetaballsPlayer) {
      this._endMetaballsPlayer = null;

      if (this._endTarget) {
        this._endTarget.addChildrenToSprite();
      }
    }

    player.parent = null;
    player.destroy();
  }

  private setTopBlobSpritesInfo(__blobSpritesInfo: BrandBlobButton): void {
    // Reset
    if (__blobSpritesInfo !== this._topBlobSpritesInfo) {
      this.unsetTopBlobSpritesInfo();

      this._topBlobSpritesInfo = __blobSpritesInfo;
      this._topBlobSpritesInfo.addChildrenToSprite(this._layerAboveAnimation);
    }
  }

  private getSpeedRemappedPhase(__phase: number): number {
    // Remaps a phase of value 0-1 to the one mapped according to the speed
    if (__phase <= 0) {
      return 0;
    }
    if (__phase >= 1) {
      return 1;
    } else {
      // Middle, does linear interpolation between two known values
      const fullPhase: number = __phase * (this._mappedPhase.length - 1);
      const pi: number = Math.floor(fullPhase);
      const pf: number = fullPhase - pi;

      return map(pf, 0, 1, this._mappedPhase[pi], this._mappedPhase[pi + 1]);
    }
  }

  private playNextSequence(): void {
    // Pick and play a sequence

    console.log('next sequence');

    // Plots sequence
    if (this._debug_sequencePathShape) {
      this._debug_sequencePathShape.clear();
    }
    
    let i: number, j: number;

    this.stopQueueingNextSequence();

    this._currentSequenceDefinition = this.getNextSequenceDefinition();

    if (this._currentSequenceDefinition != null) {
      // Maps phase
      // This works to re-map speed. With this system, a position phase of 0.25 (25% of the animation) grabs the phase from mappedPhase from (0.25 * mappedPhase.length)
      // and it'll have the new phase based on the "speeds" list.
      // It's a bit of a brute force approach and not 100% correct (since it interpolates positions) but it works well for this use.

      const ti: number = getTimer();

      // First, create a list of unweighted phases
      const preMappedPhase: number[] = [];
      let currPhase: number = 0;

      for (i = 0; i < SequenceLayer.NUM_MAPPED_PHASE_POINTS; i++) {
        preMappedPhase[i] = currPhase;
        if (i < SequenceLayer.NUM_MAPPED_PHASE_POINTS - 1) {
          currPhase += this.getSplineInterpolationPosition(
            this._currentSequenceDefinition.speeds,
            i / (SequenceLayer.NUM_MAPPED_PHASE_POINTS - 2)
          ); // Normally, around 1
        }
      }

      // Now, re-maps to start at 0 and end at 1
      this._mappedPhase = [];
      for (i = 0; i < SequenceLayer.NUM_MAPPED_PHASE_POINTS; i++) {
        this._mappedPhase[i] = preMappedPhase[i] / currPhase;
      }

      // Decide which metaballs to use
      if (this._currentSequenceDefinition.playMetaballsStart) {
        this._startMetaballDefinition = this.getNextMetaballsDefinition();
      }

      if (this._currentSequenceDefinition.playMetaballsEnd) {
        this._endMetaballDefinition = this.getNextMetaballsDefinition();
      }

      if (this._startTarget != null) {
        this._startTarget.addChildrenToSprite();
      }

      if (this._endTarget != null) {
        this._endTarget.addChildrenToSprite();
      }

      // Decide on the target blobs
      this._startTarget = null;
      this._endTarget = null;

      const maxTries: number = 5;
      let tries: number;

      tries = 0;
      while (
        (this._startTarget == null || this._endTarget == null) &&
        tries < maxTries
      ) {
        if (
          this._currentSequenceDefinition.travelBlobs &&
          (!this._currentSequenceDefinition.sameBlob ||
            (this._currentSequenceDefinition.sameBlob &&
              RandomGenerator.getBoolean()))
        ) {
          // Travel between two blobs
          this._startTarget = this.getRandomBlobSpritesInfo(
            this._currentSequenceDefinition.childBlob
          );
          if (this._startTarget != null) {
            this._endTarget = this.getRandomBlobSpritesInfo(
              this._currentSequenceDefinition.childBlob,
              this._startTarget
            );
          }
        } else if (this._currentSequenceDefinition.sameBlob) {
          // Use same blob
          this._startTarget = this._endTarget = this.getRandomBlobSpritesInfo(
            this._currentSequenceDefinition.childBlob
          );
        }

        tries++;
      }

      if (this._startTarget == null || this._endTarget == null) {
        // Could not find suitable targets

        console.warn(
          'Could not find suitable targets for sequence animation. Will wait and try again'
        );
        this._currentSequenceDefinition = null;
        this.queueNextSequence(true);
        return;
      }

      if (this._debug_sequencePathShape) {
        this._debug_sequencePathShape.lineStyle(4, 0x009900, 0.7);
        this._debug_sequencePathShape.drawEllipse(
          this._startTarget.nodeInfo.position.x,
          this._startTarget.nodeInfo.position.y,
          this._startTarget.nodeRadius,
          this._startTarget.nodeRadius
        );

        this._debug_sequencePathShape.lineStyle(4, 0x009999, 0.7);
        this._debug_sequencePathShape.drawEllipse(
          this._endTarget.nodeInfo.position.x,
          this._endTarget.nodeInfo.position.y,
          this._endTarget.nodeRadius - 5,
          this._endTarget.nodeRadius - 5
        );
      }

      // Decides other attributes
      this._startAngle = NaN;
      this._endAngle = NaN;
      tries = 0;

      const HIT_RADIUS: number = 20; // Margin each point needs to be allowed
      const SEGMENTS_PER_PATH: number = 20; // Segments to check for the whole path

      let failedHitTests: boolean = false;
      let f: number, s: number;
      let p1: Point, p2: Point, pp: Point;

      // Prepares re-mapped heights
      this._mappedHeights = [];

      failedHitTests = true;

      while (failedHitTests && tries < maxTries) {
        this._startAngle =
          isNaN(this._currentSequenceDefinition.minStartAngle) ||
          isNaN(this._currentSequenceDefinition.maxStartAngle)
            ? -Math.PI * 0.5
            : RandomGenerator.getInRange(
                this._currentSequenceDefinition.minStartAngle,
                this._currentSequenceDefinition.maxStartAngle
              ) * MathUtils.DEG2RAD;
        this._endAngle =
          this._startTarget === this._endTarget
            ? this._startAngle
            : isNaN(this._currentSequenceDefinition.minEndAngle) ||
              isNaN(this._currentSequenceDefinition.maxEndAngle)
              ? -Math.PI * 0.5
              : RandomGenerator.getInRange(
                  this._currentSequenceDefinition.minEndAngle,
                  this._currentSequenceDefinition.maxEndAngle
                ) * MathUtils.DEG2RAD;
        this._startAnglePoint = polar(
          this._startTarget.nodeRadius,
          this._startAngle
        );
        this._endAnglePoint = polar(this._endTarget.nodeRadius, this._endAngle);

        failedHitTests = false;

        // Check if it overlaps anything
        if (
          this._currentSequenceDefinition.avoidOverlap ||
          this._currentSequenceDefinition.avoidBleed
        ) {
          // This is a little bit duplicated from update() - need to make it better to avoid redundant code
          // (it's a bit problematic because the start/end point can change WHILE playing the sequence)

          // Check a number of points in the whole sequence to see if it hits any other blob, or bleeds outside of the area
          failedHitTests = false;

          // Prepares re-mapped heights
          this._mappedHeights = [];

          if (this._startTarget === this._endTarget) {
            // Same blob
            p1 = p2 = addPoints(
              this._startTarget.position,
              this._startAnglePoint
            );
          } else {
            // Moving from one blob to another
            p1 = addPoints(this._startTarget.position, this._startAnglePoint);
            p2 = addPoints(this._endTarget.position, this._endAnglePoint);
          }

          this.createMappedHeights(p1, p2);

          // Check all positions
          for (i = 0; i <= SEGMENTS_PER_PATH; i++) {
            f = i / SEGMENTS_PER_PATH;
            s = this.getSplineInterpolationPosition(
              this._currentSequenceDefinition.scales,
              f
            );
            pp = new Point(
              map(f, 0, 1, 0, p2.x - p1.x),
              this.getSplineInterpolationPosition(this._mappedHeights, f) - p1.y
            );
            pp = polar(
              originDistance(pp),
              Math.atan2(pp.y, pp.x) +
                map(f, 0, 1, this._startAngle, this._endAngle) +
                Math.PI * 0.5
            );

            pp = addPoints(pp, p1);

            if (this._debug_sequencePathShape) {
              this._debug_sequencePathShape.lineStyle(2, 0x00aaaa, 0.8);
              this._debug_sequencePathShape.drawEllipse(pp.x, pp.y, 20, 20);
            }

            // Check if it goes out of the valid area
            if (this._currentSequenceDefinition.avoidBleed) {
              if (!this._animationArea.contains(pp.x, pp.y)) {
                failedHitTests = true;
                break;
              }
            }

            // Check overlap against other objects
            if (this._currentSequenceDefinition.avoidOverlap) {
              for (j = 0; j < this._buttons.length; j++) {
                const otherButton = this._buttons[j];
                const radius = otherButton.nodeRadius + HIT_RADIUS * s;

                if (
                  otherButton !== this._startTarget &&
                  distance(otherButton.nodeInfo.position, pp) < radius
                ) {
                  if (this._debug_sequencePathShape) {
                    this._debug_sequencePathShape.lineStyle(2, 0xaa0000, 1);
                    this._debug_sequencePathShape.drawEllipse(
                      otherButton.nodeInfo.position.x,
                      otherButton.nodeInfo.position.y,
                      radius,
                      radius
                    );
                  }

                  failedHitTests = true;
                  break;
                }
              }
            }

            if (failedHitTests) {
              break;
            }
          }
        }

        if (isNaN(this._startAngle) || isNaN(this._endAngle)) {
          console.warn('Hitting target, trying again');
        }

        tries++;
      }

      // Console.timeEnd("seq");

      if (failedHitTests) {
        // Could not find suitable angle
        console.warn(
          'Could not find suitable angle for sequence animation. Will wait and try again'
        );
        this._lastSequenceAnimationTried = this._currentSequenceDefinition.animationId;
        this._currentSequenceDefinition = null;
        this.queueNextSequence(true);
        return;
      }

      // info("Found valid target with angle " + (startAngle * MathUtils.RAD2DEG));

      // Changes depth of targets
      this._startTarget.addChildrenToSprite(this._layerUnderAnimation);
      this._endTarget.addChildrenToSprite(this._layerUnderAnimation);

      this._startRotation = this._currentSequenceDefinition.alignWithTarget
        ? this._startAngle + Math.PI * 0.5
        : 0;
      this._endRotation = this._currentSequenceDefinition.alignWithTarget
        ? this._endAngle + Math.PI * 0.5
        : 0;

      this._startRotation +=
        this._currentSequenceDefinition.rotationOffset * MathUtils.DEG2RAD;
      this._endRotation +=
        this._currentSequenceDefinition.rotationOffset * MathUtils.DEG2RAD;

      if (getTimer() - ti > 10) {
        console.warn(
          'Warning: took ' +
            (getTimer() - ti) +
            ' ms to pick a sequence to play.'
        );
      }

      const graphWidth: number = 200;

      // Plots position graph
      if (this._debug_sequencePathShape) {
        this._debug_sequencePathShape.lineStyle(2, 0x3300aa, 0.8);
        const numGraphSegments: number = 50;
        for (i = 0; i <= numGraphSegments; i++) {
          // log(i, i / numGraphSegments * (currentSequence.heights.length - 1));
          if (i === 0) {
            this._debug_sequencePathShape.moveTo(
              (i / numGraphSegments) * graphWidth,
              this.getSplineInterpolationPosition(
                this._currentSequenceDefinition.heights,
                i / numGraphSegments
              ) * -100
            );
          } else {
            this._debug_sequencePathShape.lineTo(
              (i / numGraphSegments) * graphWidth,
              this.getSplineInterpolationPosition(
                this._currentSequenceDefinition.heights,
                i / numGraphSegments
              ) * -100
            );
          }
        }

        // Plots size chart
        const numCircles: number = 20;
        for (i = 0; i <= numCircles; i++) {
          this._debug_sequencePathShape.lineStyle(1, 0x660000, 0.8);
          this._debug_sequencePathShape.beginFill(0xff0000, 0.5);
          this._debug_sequencePathShape.drawCircle(
            (i / numCircles) * graphWidth,
            40,
            5 *
              this.getSplineInterpolationPosition(
                this._currentSequenceDefinition.scales,
                i / numCircles
              )
          );
          this._debug_sequencePathShape.endFill();
        }

        // Plots phase remapping chart
        for (i = 0; i <= numCircles; i++) {
          this._debug_sequencePathShape.lineStyle(1, 0x660000, 0.8);
          this._debug_sequencePathShape.beginFill(0xff0000, 0.5);
          this._debug_sequencePathShape.drawCircle(
            this.getSpeedRemappedPhase(i / numCircles) * graphWidth,
            80,
            2
          );
          this._debug_sequencePathShape.endFill();
        }
      }

      this._lastSequenceAnimationPlayed = this._lastSequenceAnimationTried = this._currentSequenceDefinition.animationId;
      // log("Playing sequence: " + currentSequence.animationId);
      this.createCurrentSequencePlayer();
    }
  }

  private getNextMetaballsDefinition(): MetaballItemDefinition {
    // Pick a metaball definition to use
    const allMetaballs = Object.keys(MetaballItemDefinitions).map(
      key => MetaballItemDefinitions[key]
    );

    // Finds total weight, removing disabled sequences
    let i: number;
    let totalWeight: number = 0;

    for (i = 0; i < allMetaballs.length; i++) {
      if (allMetaballs[i].frequency > 0) {
        // Normal item
        totalWeight += allMetaballs[i].frequency;
      } else {
        // Disabled item, removes this item from the list
        allMetaballs.splice(i, 1);
        i--;
      }
    }

    // Pick an item
    const f: number = Math.random() * totalWeight;
    totalWeight = 0;
    for (i = 0; i < allMetaballs.length; i++) {
      totalWeight += allMetaballs[i].frequency;
      if (totalWeight >= f) {
        // This one
        return allMetaballs[i];
      }
    }

    console.error('Could not find a metaball to use!');
    return null;
  }

  private createCurrentSequencePlayer(): void {
    this.destroyCurrentSequencePlayer();

    // Creates actual animation player
    this._sequencePlayer = new AnimatedSpriteController(
      this._currentSequenceDefinition.animation
    );

    // this._sequencePlayer.sprite.anchor.set(
    //   this._currentSequenceDefinition.centerX,
    //   this._currentSequenceDefinition.centerY
    // );
    this._sequencePlayer.sprite.visible = false;
    this._sequenceScaleX = this._scale;
    this._sequenceScaleY = this._scale;

    if (!this._currentSequenceDefinition.isDirectionRight) {
      this._sequenceScaleX *= -1;
    }
    if (
      (this._endTarget != null &&
        this._endTarget.position.x < this._startTarget.position.x) ||
      (this._endTarget == null && Math.random() > 0.5)
    ) {
      this._sequenceScaleX *= -1;
    }
    if (
      this._currentSequenceDefinition.alignWithTarget &&
      this._currentSequenceDefinition.flipOnAligning &&
      (this._startAngle > Math.PI * 0.5 && this._startAngle < Math.PI * 1.5)
    ) {
      this._sequenceScaleX *= -1;
      this._startRotation += Math.PI;
      this._endRotation += Math.PI;
    }

    this._sequencePlayer.sprite.filters = [this._sequenceFilter];

    if (this._startTarget === this._endTarget) {
      // Just one target, so update the color to match
      if (this._currentSequenceDefinition.tinted) {
        this.setSequenceFilter(
          Color.fromString(
            this._startTarget.pourable.design.colors.animationDark
          ),
          Color.fromString(
            this._startTarget.pourable.design.colors.animationLight
          )
        );
      } else {
        this._sequencePlayer.sprite.filters = [];
      }
    }

    // Load animation
    this._sequencePlayer.play();
    this._sequencePlayer.pause();
    this._sequencePlayer.parent = this._layerAnimation;

    // Prepares for starting
    this._timeCurrentSequenceStartedPlaying = 0;
  }

  private setSequenceFilter(__colorDark: Color, __colorLight: Color): void {
    // Sets the tinting of the current sequence
    this._sequenceFilter.matrix = this.getColorMatrix(
      __colorDark,
      __colorLight
    );
  }

  private getColorMatrix(__colorDark: Color, __colorLight: Color): number[] {
    // Returns a number vector for color tinting filter, where black is colorDark and white is colorLight

    const r = __colorLight.r - __colorDark.r;
    const ra = __colorDark.r;

    const g = __colorLight.g - __colorDark.g;
    const ga = __colorDark.g;

    const b = __colorLight.b - __colorDark.b;
    const ba = __colorDark.b;

    return [r, 0, 0, 0, ra, 0, g, 0, 0, ga, 0, 0, b, 0, ba, 0, 0, 0, 1, 0];
  }

  private createMappedHeights(__p1: Point, __p2: Point) {
    // Re-maps heights: center uses max Y, sides use target's y
    let i: number;

    const heightsCount = this._currentSequenceDefinition.heights.length;

    const highestY: number = Math.min(__p1.y, __p2.y);
    const halfPoint: number = (heightsCount - 1) / 2;

    for (i = 0; i < heightsCount; i++) {
      this._mappedHeights[i] =
        map(
          Math.abs(halfPoint - i) / halfPoint,
          0,
          1,
          highestY,
          i < halfPoint ? __p1.y : __p2.y
        ) -
        this._currentSequenceDefinition.heights[i] *
          this._currentSequenceDefinition.animation.frameHeight; // * s
      // Hack - the above doesn't work correctly if the heights has a length of 1
      if (isNaN(this._mappedHeights[i])) {
        this._mappedHeights[i] = highestY;
      }
    }
  }

  private getNextSequenceDefinition(): SequenceItemDefinition {
    // Decides which sequence to play next

    const allSequences: SequenceItemDefinition[] = Object.keys(
      SequenceItemDefinitions
    ).map(key => SequenceItemDefinitions[key]);

    // Finds total weight, removing disabled sequences
    let i: number;
    let totalWeight: number = 0;

    for (i = 0; i < allSequences.length; i++) {
      if (allSequences[i].frequency > 0) {
        // Normal item
        totalWeight += allSequences[i].frequency;
      } else {
        // Disabled item, removes this item from the list
        allSequences.splice(i, 1);
        i--;
      }
    }

    // Remove the last animation tried if possible
    for (i = 0; i < allSequences.length; i++) {
      if (
        this._lastSequenceAnimationTried != null &&
        allSequences[i].animationId === this._lastSequenceAnimationTried &&
        allSequences.length > 1
      ) {
        totalWeight -= allSequences[i].frequency;
        allSequences.splice(i, 1);
        i--;
      }
    }

    // also remove previous animation if possible
    for (i = 0; i < allSequences.length; i++) {
      if (
        this._lastSequenceAnimationPlayed != null &&
        allSequences[i].animationId === this._lastSequenceAnimationPlayed &&
        allSequences.length > 1
      ) {
        totalWeight -= allSequences[i].frequency;
        allSequences.splice(i, 1);
        i--;
      }
    }

    // Pick an item
    const f: number = Math.random() * totalWeight;
    totalWeight = 0;

    for (i = 0; i < allSequences.length; i++) {
      totalWeight += allSequences[i].frequency;
      if (totalWeight >= f) {
        // This one
        return allSequences[i];
      }
    }

    console.error('Could not find a sequence to play');
    return null;
  }

  private getSplineInterpolationPosition(
    __values: number[],
    __phase: number
  ): number {
    // Gets a spline-ish interpolated value using catmull-rom splines (passing through all points)
    // __phase is 0-1

    if (__values.length === 1) {
      return __values[0];
    }

    if (__values.length === 2) {
      return __values[0] * __phase + __values[1] * (1 - __phase);
    }

    // http://en.wikipedia.org/wiki/Spline_interpolation

    // Find position (x1, x2 and t)
    const pos: number = Math.floor(__phase * (__values.length - 1));
    const inPhase: number = __phase * (__values.length - 1) - pos;

    // Hermite interpolation
    if (pos <= 0) {
      // Beginning value
      return this.getInterpolatedPositionHermite(
        __values[pos] + (__values[pos] - __values[pos + 1]),
        __values[pos],
        __values[pos + 1],
        __values[pos + 2],
        inPhase
      );
    } else if (pos >= __values.length - 1) {
      // After end value
      return __values[pos];
    } else if (pos >= __values.length - 2) {
      // End value
      return this.getInterpolatedPositionHermite(
        __values[pos - 1],
        __values[pos],
        __values[pos + 1],
        __values[pos + 1] + (__values[pos + 1] - __values[pos]),
        inPhase
      );
    } else {
      // Middle value
      return this.getInterpolatedPositionHermite(
        __values[pos - 1],
        __values[pos],
        __values[pos + 1],
        __values[pos + 2],
        inPhase
      );
    }
  }

  private getTangents(p0: number, p1: number, p2: number, p3: number) {
    // Find the tangents of a curve segment using Kochanek-Bartels splines
    // http://en.wikipedia.org/wiki/Kochanek%E2%80%93Bartels_spline

    const t: number = -1; // Tension; curve smoothness, as it changes the length of the tangent vector (-1 forces straight on point; 1 = produces a line)
    const b: number = 0; // Bias; (-1 = align to hit the point at the right angle; 1 = align to hit the point in the easiet way after leaving the previous point)
    const c: number = 0; // Continuity; (-1 = produces a line; 1 = pointy thing)

    // 0, 0, 0 is the same as a catmull-rom

    const m1: number =
      (((1 - t) * (1 + b) * (1 + c)) / 2) * (p1 - p0) +
      (((1 - t) * (1 - b) * (1 - c)) / 2) * (p2 - p1);
    const m2: number =
      (((1 - t) * (1 + b) * (1 - c)) / 2) * (p2 - p1) +
      (((1 - t) * (1 - b) * (1 + c)) / 2) * (p3 - p2);

    return {
      m1,
      m2
    };
  }

  private getInterpolatedPositionHermite(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    t: number,
    m1: number = NaN,
    m2: number = NaN
  ): number {
    // Gets all positions on a curve between p1 and p2 using a Cubic Hermite spline
    // http://en.wikipedia.org/wiki/Cubic_Hermite_spline

    // Tangents
    const t3: number = t * t * t;
    const t2: number = t * t;

    if (isNaN(m1) || isNaN(m2)) {
      const tangents = this.getTangents(p0, p1, p2, p3);
      m1 = tangents.m1;
      m2 = tangents.m2;
    }

    return (
      (2 * t3 - 3 * t2 + 1) * p1 +
      (t3 - 2 * t2 + t) * m1 +
      (-2 * t3 + 3 * t2) * p2 +
      (t3 - t2) * m2
    );
  }

  private getRandomBlobSpritesInfo(
    __allowChildBlobs: boolean,
    __startTarget: BrandBlobButton = null
  ): BrandBlobButton {
    // Picks a blobsSpriteInfo to be the start or end target of the animation sequence

    // Creates a list of allowed blob sprites
    const allowedBlobsSprites: BrandBlobButton[] = [];
    let i: number;

    for (i = 0; i < this._buttons.length; i++) {
      // Check if it's already used
      if (
        (__startTarget == null || this._buttons[i] !== __startTarget) &&
        this._buttons[i].available === 1 &&
        (__allowChildBlobs || this._buttons[i].parentBlob == null)
      ) {
        // Not the start target item, or there's no start target yet; continue

        // Check beverage restriction
        if (
          this._currentSequenceDefinition.restrictedBeverageIds.length === 0 ||
          this._currentSequenceDefinition.restrictedBeverageIds.indexOf(
            this._buttons[i].pourable.id
          ) > -1
        ) {
          // No restriction to beverage ids, or the blob sprites info has a beverage id that is allowed; continue

          // Check angle
          if (__startTarget == null) {
            // First target, so no angle to check
            allowedBlobsSprites.push(this._buttons[i]);
          } else {
            // Second target
            let angle: number = Math.atan2(
              this._buttons[i].nodeInfo.position.y -
                __startTarget.nodeInfo.position.y,
              this._buttons[i].nodeInfo.position.x -
                __startTarget.nodeInfo.position.x
            );
            if (angle > Math.PI * 0.5) {
              // Other side, so flip it
              angle = Math.PI - angle;
            }

            // log("angles: " + currentSequence.minTravelAngle + " -> " + currentSequence.maxTravelAngle + " = " + angle * MathUtils.RAD2DEG);

            if (
              (isNaN(this._currentSequenceDefinition.minTravelAngle) ||
                angle >=
                  this._currentSequenceDefinition.minTravelAngle *
                    MathUtils.DEG2RAD) &&
              (isNaN(this._currentSequenceDefinition.maxTravelAngle) ||
                angle <=
                  this._currentSequenceDefinition.maxTravelAngle *
                    MathUtils.DEG2RAD)
            ) {
              // Inside the allowed angle cone, so use it
              allowedBlobsSprites.push(this._buttons[i]);
            }
          }
        }
      }
    }

    // log("==> " + allowedBlobsSprites.length + " blob sprites can be used for animation");

    if (allowedBlobsSprites.length === 0) {
      // No suitable blob could be found, return null (invalidating the selection)
      return null;
    }

    // Finally, pick one of the items
    return allowedBlobsSprites[
      RandomGenerator.getInIntegerRange(0, allowedBlobsSprites.length - 1)
    ];
  }

  private removeMetaballPlayer(metaball: AnimatedSpriteController): void {
    if (metaball != null) {
      if (metaball === this._startMetaballsPlayer) {
        this._startMetaballsPlayer = null;
      }

      if (metaball === this._endMetaballsPlayer) {
        this._endMetaballsPlayer = null;
        if (this._endTarget != null) {
          this._endTarget.addChildrenToSprite();
        }
      }

      metaball.parent = null;
      metaball.destroy();
    }
  }

  private unsetTopBlobSpritesInfo() {
    if (this._topBlobSpritesInfo != null) {
      this._topBlobSpritesInfo.addChildrenToSprite(this._layerUnderAnimation);
      this._topBlobSpritesInfo = null;
    }
  }

  private destroyCurrentSequencePlayer() {
    if (this._sequencePlayer != null) {
      this.unsetTopBlobSpritesInfo();

      this._sequencePlayer.parent = null;
      this._sequencePlayer = null;
    }
  }

  private queueNextSequence(__fast: boolean = false) {
    this._timeToPlayNextSequence =
      this._lastMeasuredTime +
      SequenceLayer.TIME_WAIT_BETWEEN_SEQUENCES * (__fast ? 0.2 : 1);
  }

  private stopQueueingNextSequence() {
    this._timeToPlayNextSequence = -1;
  }
}
