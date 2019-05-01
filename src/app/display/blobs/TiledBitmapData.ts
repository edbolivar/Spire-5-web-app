import { Rectangle, RenderTexture } from 'pixi.js';
import { MathUtils } from '../../utils/MathUtils';

export class TiledBitmapData {
  // Properties
  protected _renderTexture: RenderTexture;

  protected _tileDimensions: number; // Resolution to use (dimensions for each tile)
  protected _numTiles: number; // Num of tiles used
  protected _maxTiles: number; // Max tiles allowed

  protected _cols: number; // Cols possible
  protected _rows: number; // Rows possible

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(
    __maxTextureDimensions: number,
    __tileDimensions: number,
    __maxTiles: number
  ) {
    this._tileDimensions = __tileDimensions;
    this._numTiles = 0;
    this._maxTiles = __maxTiles;

    const maxCols: number = Math.floor(__maxTextureDimensions / __tileDimensions);
    const maxRows: number = Math.floor(__maxTextureDimensions / __tileDimensions);

    this._cols = Math.min(maxCols, __maxTiles);
    this._rows = Math.min(maxRows, Math.ceil(__maxTiles / this._cols));

    let w: number = __tileDimensions * this._cols;
    let h: number = __tileDimensions * this._rows;

    const totalGPUPixels: number =
      MathUtils.getHighestPowerOfTwo(w) * MathUtils.getHighestPowerOfTwo(h);

    // Find the size that uses the less amount of pixels; if size is small, try to get the most square one (just to limit dimensions; but only if the actual area used is smaller)
    let bestCols: number = this._cols;
    let bestPixelAreaGPU: number = totalGPUPixels;
    let bestPixelAreaSoftware: number = w * h;
    let bestPixelPerimeter: number =
      MathUtils.getHighestPowerOfTwo(w) * 2 +
      MathUtils.getHighestPowerOfTwo(h) * 2;
    let tCols: number = this._cols;
    let tRows: number = Math.floor(this._maxTiles / tCols);
    let tPixelAreaGPU: number;
    let tPixelAreaSoftware: number;
    let tPixelPerimeter: number;

    while (tCols > 0 && tRows <= maxRows) {
      tPixelAreaGPU =
        MathUtils.getHighestPowerOfTwo(tCols * __tileDimensions) *
        MathUtils.getHighestPowerOfTwo(tRows * __tileDimensions);
      tPixelAreaSoftware = tCols * __tileDimensions * tRows * __tileDimensions;
      tPixelPerimeter =
        MathUtils.getHighestPowerOfTwo(tCols * __tileDimensions) * 2 +
        MathUtils.getHighestPowerOfTwo(tRows * __tileDimensions) * 2;
      if (
        tPixelAreaGPU < bestPixelAreaGPU ||
        (tPixelAreaGPU === bestPixelAreaGPU &&
          tPixelPerimeter < bestPixelPerimeter &&
          tPixelAreaSoftware <= bestPixelAreaSoftware)
      ) {
        bestPixelAreaGPU = tPixelAreaGPU;
        bestPixelAreaSoftware = tPixelAreaSoftware;
        bestPixelPerimeter = tPixelPerimeter;
        bestCols = tCols;
      }
      tCols--;
      tRows = Math.ceil(this._maxTiles / tCols);
    }

    if (this._cols !== bestCols) {
      this._cols = bestCols;
      this._rows = Math.ceil(this._maxTiles / this._cols);
      w = __tileDimensions * this._cols;
      h = __tileDimensions * this._rows;
    }

    if (this._cols * this._rows < __maxTiles) {
      console.warn(
        `Warning: tried creating a tile texture with ${__maxTiles} tiles of dimensions ${__tileDimensions}, but only ${this._cols * this._rows} are allowed due to a max texture dimension of ${__maxTextureDimensions}.`
      );
    }

    this._renderTexture = RenderTexture.create(w, h);
  }

  // ================================================================================================================
  // STATIC INTERFACE -----------------------------------------------------------------------------------------------

  static getTileRectangle(
    __width: number,
    __height: number,
    __dimensions: number,
    __tileIndex: number
  ): Rectangle {
    // Helper function to generate a texture rectangle for a tile
    const cols: number = Math.floor(__width / __dimensions);
    const rows: number = Math.floor(__height / __dimensions);

    const col: number = __tileIndex % cols;
    const row: number = Math.floor(__tileIndex / cols) % rows;

    return new Rectangle(
      col * __dimensions,
      row * __dimensions,
      __dimensions,
      __dimensions
    );
  }

  // ================================================================================================================
  // INTERNAL INTERFACE ---------------------------------------------------------------------------------------------

  // ================================================================================================================
  // PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

  getTileRect(__index: number): Rectangle {
    // Return a given tile's rectangle
    return TiledBitmapData.getTileRectangle(
      this._renderTexture.width,
      this._renderTexture.height,
      this._tileDimensions,
      __index
    );
  }

  // ================================================================================================================
  // ACCESSOR INTERFACE ---------------------------------------------------------------------------------------------

  get texture(): RenderTexture {
    return this._renderTexture;
  }

  get numTiles(): number {
    return this._numTiles;
  }
}
