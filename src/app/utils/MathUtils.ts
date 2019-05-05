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
}
