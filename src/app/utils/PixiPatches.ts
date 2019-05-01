import * as PIXI from '../../assets/pixi.min.js';

export default class PixiPatches {

	public static patchAll() {
		this.patchTransparentVideos();
	}

	public static patchTransparentVideos() {
		// Patch transparent videos in pixi, so they don't have artifacts
		// @see https://github.com/pixijs/pixi.js/issues/4089
		PIXI.glCore.GLTexture.prototype.upload = function(source) {
			this.bind();
			const gl = this.gl;

			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);

			const isVideo = source instanceof HTMLVideoElement;
			const newWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
			const newHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

			if (newHeight !== this.height || newWidth !== this.width || isVideo) {
				gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, source);
			} else {
				gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.format, this.type, source);
			}

			this.width = newWidth;
			this.height = newHeight;
		};
	}
}
