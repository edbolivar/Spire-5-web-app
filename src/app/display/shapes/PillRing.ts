import { Graphics } from "pixi.js";
import { map } from "moremath";

export default class PillRing extends Graphics {

	private __width: number;
	private __height: number;
	private _color: number;
	private _strokeWidth: number;


	// ================================================================================================================
	// CONSTRUCTOR ----------------------------------------------------------------------------------------------------

    constructor(color: number = 0xff00ff, width: number = 100, height: number = 100, strokeWidth: number = 5) {
		super();

		this._color = color;

		this.redrawShape();
		this.__width = width;
		this.__height = height;
		this._strokeWidth = strokeWidth;
	}

	// ================================================================================================================
	// PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

	public get color() {
		return this._color;
	}

	public set color(color: number) {
		this._color = color;
		this.redrawShape();
	}

	public get width() {
		return this.__width;
	}

	public set width(width: number) {
		if (this.__width !== width) {
			this.__width = width;
			this.redrawShape();
		}
	}

	public get height() {
		return this.__height;
	}

	public set height(height: number) {
		if (this.__height !== height) {
			this.__height = height;
			this.redrawShape();
		}
	}

	public get strokeWidth() {
		return this._strokeWidth;
	}

	public set strokeWidth(strokeWidth: number) {
		if (this._strokeWidth !== strokeWidth) {
			this._strokeWidth = strokeWidth;
			this.redrawShape();
		}
	}

	public destroy() {
		super.destroy();
	}


	// ================================================================================================================
	// PRIVATE INTERFACE -----------------------------------------------------------------------------------------------

	private redrawShape() {
		const w = Math.max(this.__width, this.__height) - this._strokeWidth;
		const h = this.__height - this._strokeWidth;
		const radius = Math.min(w, h) / 2;

		var points: number[] = this.generatePill(this._strokeWidth / 2, this._strokeWidth / 2, w, h, radius);

		this.beginFill(0x00000000, 0);
		this.lineStyle(this._strokeWidth, this._color, 1);
		this.drawPolygon(points);
		this.endFill();
	}

	private generatePill(x: number, y: number, width: number, height: number, radius: number) {
		// We generate the curves manually because drawRoundedRect() doesn't use actual round corners
		const points: number[] = [];
		this.generateCornerCurve(points, x + radius, y + radius, -radius, -radius);
		this.generateCornerCurve(points, x + width - radius, y + radius, radius, -radius, true);
		this.generateCornerCurve(points, x + width - radius, y + height - radius, radius, radius);
		this.generateCornerCurve(points, x + radius, y + height - radius, -radius, radius, true);
		
		return points;
	}

	private generateCornerCurve(points: number[], x: number, y: number, radiusX: number, radiusY: number, reverse: boolean = false) {
		const segments = 10;
		for (let i = 0; i <= segments; i++) {
			let angle = map(i, 0, segments, 0, Math.PI / 2);
			if (reverse) angle = Math.PI / 2 - angle;
			// X and Y
			const cx = x + Math.cos(angle) * radiusX;
			const cy = y + Math.sin(angle) * radiusY;
			if (points.length < 2 || cx != points[points.length - 2] || cy != points[points.length - 1]) {
				points.push(x + Math.cos(angle) * radiusX);
				points.push(y + Math.sin(angle) * radiusY);
			}
		}
	}
}
