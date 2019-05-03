const TWO_PI = 2 * Math.PI;

interface IPoint {
	x: number;
	y: number;
}

function getInCircle(radius: number): IPoint  {
	// http://stackoverflow.com/questions/5837572/generate-a-random-point-within-a-circle-uniformly

	// Uniform generator (radius-angle would concentrate in middle)
	let a = Math.random();
	let b = Math.random();
	if (a > b) {
		const c = b;
		b = a;
		a = c;
	}

	const p = TWO_PI * a / b;

	return { x: b * radius * Math.cos(p), y: b * radius * Math.sin(p) };
}

function getInRange(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function getInIntegerRange(min: number, max: number): number {
	return Math.round(min + Math.random() * (max-min));
}

function getFromArray<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getColor(): number {
	return (Math.random() * 0xffffff) & 0xffffff;
}

function getBoolean(): boolean {
	return Math.random() > 0.5;
}

function getFromSeed(seed: number = -1): number {
	// Return a predictable pseudo-random number (0..0.999)
	if (seed < 0) {
		return Math.random();
	} else {
		return ((seed * 1.12836) + 0.7) % 1;
	}
}

export default {
	getInCircle,
	getInRange,
	getInIntegerRange,
	getFromArray,
	getColor,
	getBoolean,
	getFromSeed,
}
