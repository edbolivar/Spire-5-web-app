import { TiledBitmapData } from './TiledBitmapData';
import RandomGenerator from '../../utils/RandomGenerator';
import BlobShape from '../shapes/BlobShape';
import { AppInfoService } from '../../services/app-info.service';
import Box from '../shapes/Box';
import { Sprite } from 'pixi.js';

export class MultiBlobBitmap extends TiledBitmapData {

  // A BitmapData with several blobs drawn on it, tiled

  // Private
  private margin: number;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(__maxTextureDimensions: number, __tileDimensions: number, __maxTiles: number, __margin: number) {
    super(__maxTextureDimensions, __tileDimensions, __maxTiles);

    this.margin = __margin;
    this._numTiles = 0;
  }

  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  fillWithBlobs(__colorSolid: number, __alphaSolid: number, __colorStroke: number, __alphaStroke: number, __strokeWidth: number = 2, __noiseRadiusScale: number = 1, __isInverse: boolean = false, __filters: any[] = null, __repeatable: boolean = false): void {
    // Fill with shapes
    for (let i = this._numTiles; i < this._maxTiles; i++) {
      this.addBlob(__colorSolid, __alphaSolid, __colorStroke, __alphaStroke, __strokeWidth, __noiseRadiusScale, __isInverse, __filters, false, false, __repeatable ? i : -1);
    }
  }

  addBlob(__colorSolid: number, __alphaSolid: number, __colorStroke: number, __alphaStroke: number, __strokeWidth: number = 2, __noiseRadiusScale: number = 1, __isInverse: boolean = false, __filters: any[] = null, __variableOctables: boolean = false, __normalizeRadius: boolean = false, __randomSeed: number = -1): void {
    const r: number = (this._tileDimensions / 2) - this.margin;
    let col: number, row: number;
    
    col = this._numTiles % this._cols;
    row = Math.floor(this._numTiles / this._cols);
    const octavesA: number = __variableOctables ? RandomGenerator.getInIntegerRange(1, 2) : 2;
    const octavesB: number = __variableOctables ? RandomGenerator.getInIntegerRange(1, 2) : 1;

    const shape: BlobShape = new BlobShape(r, __colorSolid, __colorStroke, __strokeWidth, __noiseRadiusScale, octavesA, octavesB, __normalizeRadius, __randomSeed);
    
    // if (__filters != null) {
    //   shape.filters = __filters;
    // }

    shape.x = (this._tileDimensions * 0.5) + (col * this._tileDimensions);
    shape.y = (this._tileDimensions * 0.5) + (row * this._tileDimensions);

    AppInfoService.instance.renderer.render(shape, this._renderTexture, false);

    this._numTiles++;
  }
}

