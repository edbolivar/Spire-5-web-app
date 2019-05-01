import { map } from "moremath";

export function mapColor(value: number, startColor: number, endColor: number) {
	const c1 = (startColor >>> 0) & 0xffffff;
	const c2 = (endColor >>> 0) & 0xffffff;
	const r = map(value, 0, 1, (c1 & 0xff0000) >>> 16, (c2 & 0xff0000) >>> 16, true);
	const g = map(value, 0, 1, (c1 & 0x00ff00) >>> 8, (c2 & 0x00ff00) >>> 8, true);
	const b = map(value, 0, 1, (c1 & 0x0000ff), (c2 & 0x0000ff), true);
	return (r << 16 | g << 8 | b) >>> 0;
}

export default {
	mapColor,
};
