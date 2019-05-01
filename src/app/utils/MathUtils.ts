export class MathUtils {
  static DEG2RAD: number = (1 / 180) * Math.PI;
  static RAD2DEG: number = (1 / Math.PI) * 180;

  static rangeMod(__value: number, __min: number, __pseudoMax: number): number {
    const range: number = __pseudoMax - __min;

    __value = (__value - __min) % range;

    if (__value < 0) {
      __value = range - (-__value % range);
    }

    __value += __min;

    return __value;
  }

  static getHighestPowerOfTwo(__value: number): number {
    // Return a power of two number that is higher than the passed value
    let c: number = 1;
    while (c < __value) {
      c *= 2;
    }

    return c;
  }
}
