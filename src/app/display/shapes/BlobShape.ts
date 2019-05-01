import Graphics = PIXI.Graphics;
import NoiseSequence from '../../data/types/NoiseSequence';
import {map} from 'moremath';

export default class BlobShape extends Graphics {

  private static SHAPE_SEGMENTS = 200;						// Segments for the whole shape... more = more precise, but slower to generate
  public static NOISE_RADIUS_SCALE_STANDARD = 0.15;

  private _noiseSequenceA: NoiseSequence;
  private _noiseSequenceB: NoiseSequence;
  private _backgroundColor: number;
  private _strokeColor: number;
  private _pathCoordinates: number[] = [];
  private _strokeWidth: number;

  constructor(radius: number, solidColor: number, strokeColor: number, strokeWidth: number, noiseRadiusScale: number = NaN, octavesA: number = 2, octavesB: number = 1, normalizeRadius: boolean = false, randomSeed: number = -1) {
    super();

    const {SHAPE_SEGMENTS, NOISE_RADIUS_SCALE_STANDARD} = BlobShape;

    this._noiseSequenceA = new NoiseSequence(octavesA, randomSeed);
    this._noiseSequenceB = new NoiseSequence(octavesB, randomSeed);

    this._backgroundColor = solidColor;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;

    if (isNaN(noiseRadiusScale)) {
      noiseRadiusScale = NOISE_RADIUS_SCALE_STANDARD;
    }

    // Create the shape

    // Need to create it first
    let i: number;
    let f: number;
    let angle: number;
    const noiseRadius = radius * noiseRadiusScale; // How much to shrink
    let n: number;

    // Find all vectors
    // Find all positions
    let minRadius = NaN;
    let maxRadius = NaN;
    const radii: number[] = [];

    for (i = 0; i < SHAPE_SEGMENTS; i++) {
      f = (i % SHAPE_SEGMENTS) / SHAPE_SEGMENTS;
      n = (radius + ((this._noiseSequenceA.getNumber(f) * this._noiseSequenceB.getNumber(f) - 1) / 2) * noiseRadius - strokeWidth / 2);
      radii[i] = n;

      if (isNaN(minRadius) || n < minRadius) {
        minRadius = n;
      }
      if (isNaN(maxRadius) || n > maxRadius) {
        maxRadius = n;
      }
    }

    for (i = 0; i <= SHAPE_SEGMENTS; i++) {
      f = (i % SHAPE_SEGMENTS) / SHAPE_SEGMENTS;
      angle = f * Math.PI * 2;

      n = radii[i % SHAPE_SEGMENTS];
      if (normalizeRadius) {
        n = map(n, minRadius, maxRadius, radius - noiseRadius, radius);
      }

      this._pathCoordinates[i * 2] = Math.cos(angle) * n;
      this._pathCoordinates[i * 2 + 1] = Math.sin(angle) * n;
    }

    this.drawBlobShape();
  }

  public get backgroundColor() {
    return this._backgroundColor;
  }

  public set backgroundColor(backgroundColor: number) {
    this._backgroundColor = backgroundColor;
    this.drawBlobShape();
  }

  private drawBlobShape() {
    this.clear();

    if (this.backgroundFillAlpha() > 0) {
      this.beginFill(this.backgroundFillColor(), this.backgroundFillAlpha());
    }

    if (this.strokeFillAlpha() > 0 && this._strokeWidth > 0) {
      this.lineStyle(this._strokeWidth, this.strokeFillColor(), this.strokeFillAlpha());
    }

    this.drawPolygon(this._pathCoordinates);

    this.endFill();
  }

  private backgroundFillColor() {
    return this._backgroundColor & 0xffffff;
  }

  private backgroundFillAlpha() {
    return (this._backgroundColor >>> 24) / 255;
  }

  private strokeFillColor() {
    return this._strokeColor & 0xffffff;
  }

  private strokeFillAlpha() {
    return (this._strokeColor >>> 24) / 255;
  }
}
