import { map } from 'moremath';

export class VectorUtils {

  // Array to vector

  static arrayToBooleanVector(__array: any[]): Boolean[] {
    const v: Boolean[] = [];
    
    if (Boolean(__array)) {
      for (let i = 0; i < __array.length; i++) {
        v.push(__array[i]);
      }
    }
    
    return v;
  }

  static arrayToNumberVector(__array: any[]): number[] {
    const v: number[] = [];
    if (Boolean(__array)) {
      for (let i: number = 0; i < __array.length; i++) {
        v.push(__array[i]);
      }
    }

    return v;
  }

  static arrayToStringVector(__array: any[]): string[] {
    const v: string[] = [];

    if (Boolean(__array)) {
      for (let i = 0; i < __array.length; i++) {
        v.push(__array[i]);
      }
    }

    return v;
  }

  // Vector to array

  static booleanVectorToArray(__vector: Boolean[]): any[] {
    const l: any[] = [];

    if (Boolean(__vector)) {
      for (let i = 0; i < __vector.length; i++) {
        l.push(__vector[i]);
      }
    }

    return l;
  }

  static numberVectorToArray(__vector: number[]): any[] {
    const l: any[] = [];

    if (Boolean(__vector)) {
      for (let i = 0; i < __vector.length; i++) {
        l.push(__vector[i]);
      }
    }

    return l;
  }

  static stringVectorToArray(__vector: string[]): any[] {
    const l: any[] = [];

    if (Boolean(__vector)) {
      for (let i = 0; i < __vector.length; i++) {
        l.push(__vector[i]);
      }
    }
    
    return l;
  }

  // String to Vector

  static stringToStringVector(__string: string, __separator: string): string[] {
    const v: string[] = [];

    if (Boolean(__string) && __string.length > 0) {
      const stringList = __string.split(__separator);
      for (let i = 0; i < stringList.length; i++) {
        v.push(stringList[i]);
      }
    }

    return v;
  }

  // Other

  static getEquivalentItemFromNumberVector(__pos: number, __max: number, __numbers: number[], __average: boolean = true): number {
    // Return an item from a number list mapped from the index of another list
    if (!__average) {
      // Don't allow average, just find a number
      return __numbers[Math.round(map(__pos, 0, __max, 0, __numbers.length - 1))];
    } else {
      // Allow average, find the two nearest items and use it
      const pos = map(__pos, 0, __max, 0, __numbers.length - 1);
      const pos1 = Math.floor(pos);
      const pos2 = Math.min(pos1 + 1, __numbers.length - 1);
      return map(pos - pos1, 0, 1, __numbers[pos1], __numbers[pos2], true);
    }
  }
}
