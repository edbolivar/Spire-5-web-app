/**
 * A pseudo-noise sequence that is always repeatable and tileable (on the phase 0-1)
 */
import RandomGenerator from '../../utils/RandomGenerator';


export default class NoiseSequence {

	// Constants
	private static TWO_PI: number = Math.PI * 2;

	// Properties
	private octaves: number; // int
	private randoms: number[];
	private powers: number[]; // int


	// ================================================================================================================
	// CONSTRUCTOR ----------------------------------------------------------------------------------------------------

    constructor(octaves: number = 5, randomSeed: number = -1) {

        this.octaves = octaves;
		this.randoms = [];
		let pos = 0;
		while (this.randoms.length < octaves) {
			this.randoms.push(RandomGenerator.getFromSeed(randomSeed < 0 ? -1 : randomSeed + (pos++)) * NoiseSequence.TWO_PI);
		}

		this.powers = [];
		while (this.powers.length < octaves) {
			this.powers.push(Math.pow(2, this.powers.length));
		}
	}

	// ================================================================================================================
	// PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

	public getNumber(phase: number): number {
		// Phase is 0-1

		const r = phase * NoiseSequence.TWO_PI;

		let v = 0;
		for (let i = 0; i < this.octaves; i++) v += Math.sin(r * this.powers[i] + this.randoms[i]);
		v /= this.octaves;

		return v;
	}
}
