import { MultiBlobBitmap } from './blobs/MultiBlobBitmap';
import RandomGenerator from '../utils/RandomGenerator';
import { Texture, Rectangle } from 'pixi.js';
import { TiledBitmapData } from './blobs/TiledBitmapData';

export class TextureLibrary {
  private static _instance: TextureLibrary;

  static get instance() {
    if (!TextureLibrary._instance) {
      TextureLibrary._instance = new TextureLibrary();
    }

    return TextureLibrary._instance;
  }

  static readonly BLOB_TEXTURE_MARGIN: number = 1;
  static readonly UNIQUE_BLOB_PARTICLE_TEXTURES: number = 8;				// Number of different textures

  _textureBlobParticles: Texture;
  private _blobParticleTextureResolution: number = 64;

  constructor() {
    const gpuTextureMaximumDimensions = 2048;

    const bitmap: MultiBlobBitmap = new MultiBlobBitmap(
      gpuTextureMaximumDimensions,
      this._blobParticleTextureResolution,
      TextureLibrary.UNIQUE_BLOB_PARTICLE_TEXTURES,
      TextureLibrary.BLOB_TEXTURE_MARGIN
    );

    while (bitmap.numTiles < TextureLibrary.UNIQUE_BLOB_PARTICLE_TEXTURES) {
      bitmap.addBlob(
        0xffffffff,
        1,
        0x00000000,
        0,
        2,
        RandomGenerator.getInRange(0.2, 0.4),
        false,
        null,
        true
      );
    }
    
    this._textureBlobParticles = bitmap.texture;
  }

  getBlobParticlesTexture(): Texture {
    const tileIndex: number = Math.floor(Math.random() * TextureLibrary.UNIQUE_BLOB_PARTICLE_TEXTURES);
    const rect: Rectangle = TiledBitmapData.getTileRectangle(this._textureBlobParticles.width, this._textureBlobParticles.height, this._blobParticleTextureResolution, tileIndex);

    const texture = Texture.from(this._textureBlobParticles.baseTexture);
    texture.frame = rect;
    return texture;
  }
}
