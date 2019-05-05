import { clamp } from 'moremath';
import { MathUtils } from '../../utils/MathUtils';

function getRFromNumber(__color: number, __max: number): number {
  return (((__color >> 16) & 0xff) / 255) * __max;
}

function getGFromNumber(__color: number, __max: number): number {
  return (((__color >> 8) & 0xff) / 255) * __max;
}

function getBFromNumber(__color: number, __max: number): number {
  return ((__color & 0xff) / 255) * __max;
}

function getAFromNumber(__color: number, __max: number): number {
  return (((__color >> 24) & 0xff) / 255) * __max;
}

export class Color {
  // Constants
  private static readonly BUILT_IN_COLOR_NAMES: string[] = [
    'aqua',
    'black',
    'blue',
    'fuchsia',
    'gray',
    'green',
    'lime',
    'maroon',
    'navy',
    'olive',
    'purple',
    'red',
    'silver',
    'teal',
    'white',
    'yellow'
  ];
  private static readonly BUILT_IN_COLOR_VALUES: string[] = [
    '#0000ff',
    '#ffffff',
    '#0000ff',
    '#ff00ff',
    '#808080',
    '#008000',
    '#00ff00',
    '#800000',
    '#000080',
    '#808000',
    '#800080',
    '#ff0000',
    '#c0c0c0',
    '#008080',
    '#ffffff',
    '#ffff00'
  ];

  // Properties
  protected _r: number;
  protected _g: number;
  protected _b: number;
  protected _a: number;
  protected _h: number = 0; // for hue preservation when desaturated

  /**
   * Creates a new Color object from a number in the RRGGBB format (for example: 0x000000 for black, or 0xffffff for white). The color's alpha property is set to 1 (totally opaque).
   * @return	The new color object.
   */
  public static fromRRGGBB(__value: number): Color {
    const newColor: Color = new Color();

    newColor.r = getRFromNumber(__value, 1);
    newColor.g = getGFromNumber(__value, 1);
    newColor.b = getBFromNumber(__value, 1);
    newColor.a = 1;

    return newColor;
  }

  /**
   * Creates a new Color object from a number in the AARRGGBB format (for example: 0x00ffffff for transparent white, or 0xffffffff for opaque white).
   * @return	The new color object.
   */
  public static fromAARRGGBB(__value: number): Color {
    const newColor: Color = Color.fromRRGGBB(__value);
    newColor.a = getAFromNumber(__value, 1);
    return newColor;
  }

  /**
   * Creates a new Color object from a combination of the Red, Green, Blue and Alpha values in the 0-1 range.
   * @return	The new color object.
   */
  public static fromRGB(
    _r: number,
    _g: number,
    _b: number,
    _a: number = 1
  ): Color {
    const newColor: Color = new Color();
    newColor.r = _r;
    newColor.g = _g;
    newColor.b = _b;
    newColor.a = _a;
    return newColor;
  }

  /**
   * Creates a new Color object from the desired Hue (0-360), Saturation (0-1), and Value (0-1) values.
   * @see http://en.wikipedia.org/wiki/HSL_color_space
   * @return	The new color object.
   */
  public static fromHSV(
    __h: number,
    __s: number,
    __v: number,
    __a: number = 1
  ): Color {
    const newColor: Color = new Color();
    newColor.v = __v;
    newColor.s = __s;
    newColor.h = __h;
    newColor.a = __a;
    return newColor;
  }

  public static fromString(__value: string): Color {
    // Based on any HTML/CSS compatible string value, returns the corresponding color

    const newColor: Color = new Color();

    __value = String(__value)
      .toLowerCase()
      .split(' ')
      .join(''); // trimStringSpaces(p_value);

    if (__value.substr(0, 1) === '#') {
      // Hexadecimal color
      const colorValue: string = __value.substr(1);

      if (colorValue.length === 6) {
        // Usual #RRGGBB
        newColor.r = parseInt(colorValue.substr(0, 2), 16) / 255;
        newColor.g = parseInt(colorValue.substr(2, 2), 16) / 255;
        newColor.b = parseInt(colorValue.substr(4, 2), 16) / 255;
        newColor.a = 1;
      } else if (colorValue.length === 8) {
        // #AARRGGBB
        newColor.r = parseInt(colorValue.substr(2, 2), 16) / 255;
        newColor.g = parseInt(colorValue.substr(4, 2), 16) / 255;
        newColor.b = parseInt(colorValue.substr(6, 2), 16) / 255;
        newColor.a = parseInt(colorValue.substr(0, 2), 16) / 255;
      } else if (colorValue.length === 3) {
        // #RGB that turns into #RRGGBB
        newColor.r =
          parseInt(colorValue.substr(0, 1) + colorValue.substr(0, 1), 16) / 255;
        newColor.g =
          parseInt(colorValue.substr(1, 1) + colorValue.substr(1, 1), 16) / 255;
        newColor.b =
          parseInt(colorValue.substr(2, 1) + colorValue.substr(2, 1), 16) / 255;
        newColor.a = 1;
      } else if (colorValue.length === 4) {
        // #ARGB that turns into #AARRGGBB
        newColor.r =
          parseInt(colorValue.substr(1, 1) + colorValue.substr(1, 1), 16) / 255;
        newColor.g =
          parseInt(colorValue.substr(2, 1) + colorValue.substr(2, 1), 16) / 255;
        newColor.b =
          parseInt(colorValue.substr(3, 1) + colorValue.substr(3, 1), 16) / 255;
        newColor.a =
          parseInt(colorValue.substr(0, 1) + colorValue.substr(0, 1), 16) / 255;
      } else {
        // Wrong type!
        console.error(
          'ERROR! Wrong number of atributes in color number: ' +
            __value +
            ' (' +
            __value.length +
            ')'
        );
      }
    } else if (
      __value.substr(0, 4) === 'rgb(' &&
      __value.substr(-1, 1) === ')'
    ) {
      // rgb() function
      const colorValues = __value.substr(4, __value.length - 5).split(',');

      if (colorValues.length === 3) {
        // R,G,B
        newColor.r = this.getColorFunctionNumber(colorValues[0], 1);
        newColor.g = this.getColorFunctionNumber(colorValues[1], 1);
        newColor.b = this.getColorFunctionNumber(colorValues[2], 1);
        newColor.a = 1;
      } else if (colorValues.length === 4) {
        // R,G,B,A
        newColor.r = this.getColorFunctionNumber(colorValues[0], 1);
        newColor.g = this.getColorFunctionNumber(colorValues[1], 1);
        newColor.b = this.getColorFunctionNumber(colorValues[2], 1);
        newColor.a = this.getColorFunctionNumber(colorValues[3], 1);
      } else {
        console.error('ERROR! Wrong number of parameter in color function');
      }
    } else {
      // Must be a named color
      let i: number = 0;

      for (i = 0; i < Color.BUILT_IN_COLOR_NAMES.length; i++) {
        if (__value === Color.BUILT_IN_COLOR_NAMES[i]) {
          // Found the color
          return Color.fromString(Color.BUILT_IN_COLOR_VALUES[i]);
        }
      }

      console.error('ERROR! Impossible to parse color name [' + __value + ']');
    }

    return newColor;
  }

  public static interpolate(__c1: Color, __c2: Color, f: number): Color {
    // Linear RGB interpolation between two colors
    const newColor: Color = new Color();
    const nf: number = 1 - f;

    newColor.r = __c1.r * f + __c2.r * nf;
    newColor.g = __c1.g * f + __c2.g * nf;
    newColor.b = __c1.b * f + __c2.b * nf;
    newColor.a = __c1.a * f + __c2.a * nf;
    return newColor;
  }

  public static interpolateAARRGGBB(
    __c1: number,
    __c2: number,
    f: number
  ): number {
    const nf: number = 1 - f;

    return (
      (((__c1 & 0xff000000) * f + (__c2 & 0xff000000) * nf) & 0xff000000) |
      (((__c1 & 0xff0000) * f + (__c2 & 0xff0000) * nf) & 0xff0000) |
      (((__c1 & 0xff00) * f + (__c2 & 0xff00) * nf) & 0xff00) |
      (((__c1 & 0xff) * f + (__c2 & 0xff) * nf) & 0xff)
    );
  }

  public static interpolateRRGGBB(
    __c1: number,
    __c2: number,
    f: number
  ): number {
    const nf: number = 1 - f;

    return (
      (((__c1 & 0xff0000) * f + (__c2 & 0xff0000) * nf) & 0xff0000) |
      (((__c1 & 0xff00) * f + (__c2 & 0xff00) * nf) & 0xff00) |
      (((__c1 & 0xff) * f + (__c2 & 0xff) * nf) & 0xff)
    );
  }

  public static interpolateHSV(__c1: Color, __c2: Color, f: number): Color {
    // Linear HSL interpolation between two colors
    const newColor: Color = new Color();
    const nf: number = 1 - f;

    newColor.v = __c1.v * f + __c2.v * nf;
    newColor.s = __c1.s * f + __c2.s * nf;
    if (__c1.h - __c2.h > 180) {
      newColor.h = (__c1.h - 360) * f + __c2.h * nf;
    } else if (__c2.h - __c1.h > 180) {
      newColor.h = __c1.h * f + (__c2.h - 360) * nf;
    } else {
      newColor.h = __c1.h * f + __c2.h * nf;
    }
    newColor.a = __c1.a * f + __c2.a * nf;
    return newColor;
  }

  public static getColorFunctionNumber(__value: string, __max: number): number {
    // Based on a HTML/CSS string value, returns the correct color number (0-255)
    // Examples:
    // 0 -> 0
    // 200 -> 200 - 0.7843...
    // 100% -> 255 -> 1
    // 256 -> 255 -> 1
    // 156.7 -> 0.614...

    let finalValue: number;

    const newValue = String(__value)
      .toLowerCase()
      .split(' ')
      .join('');

    if (newValue.substr(-1, 1) === '%') {
      // Percentage
      finalValue = parseFloat(newValue.substr(0, newValue.length - 1)) / 100;
    } else {
      // Normal value
      finalValue = parseFloat(newValue) / 255;
    }

    return clamp(finalValue) * __max;
  }

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor() {
    this._r = 0;
    this._g = 0;
    this._b = 0;
    this._a = 0;
  }

  // ================================================================================================================
  // INSTANCE functions ---------------------------------------------------------------------------------------------

  /**
   * Converts this color to an integer number in the AARRGGBB format (for example: 0xff000000 for opaque black).
   */
  public toAARRGGBB(): number {
    // Returns this color as a number in the 0xAARRGGBB format
    return (Math.round(this._a * 255) << 24) | this.toRRGGBB();
  }

  /**
   * Converts this color to an integer number in the RRGGBB format, ignoring its alpha (for example: 0x000000 for black).
   */
  public toRRGGBB(): number {
    // Returns this color as a number in the 0xRRGGBB format
    return (
      (Math.round(this._r * 255) << 16) |
      (Math.round(this._g * 255) << 8) |
      Math.round(this._b * 255)
    );
  }

  /**
   * Converts this color to a readable string.
   * @return	A string describing this color.
   */
  public toString(): string {
    let txt: string = '';

    txt += '[';
    txt += 'r=' + this._r.toString(10);
    txt += ',';
    txt += 'g=' + this._g.toString(10);
    txt += ',';
    txt += 'b=' + this._b.toString(10);
    txt += ',';
    txt += 'a=' + this._a.toString(10);
    txt += ']';

    return txt;
  }

  public clone(): Color {
    const cc: Color = new Color();
    cc.r = this._r;
    cc.g = this._g;
    cc.b = this._b;
    cc.a = this._a;
    return cc;
  }

  // ================================================================================================================
  // STATIC functions -----------------------------------------------------------------------------------------------

  protected setHSV(_h: number, __s: number, __v: number): void {
    const hi: number = MathUtils.rangeMod(Math.floor(this._h / 60), 0, 6);
    const f: number = this._h / 60 - Math.floor(this._h / 60);
    const p: number = __v * (1 - __s);
    const q: number = __v * (1 - f * __s);
    const t: number = __v * (1 - (1 - f) * __s);

    switch (hi) {
      case 0:
        this._r = __v;
        this._g = t;
        this._b = p;
        break;
      case 1:
        this._r = q;
        this._g = __v;
        this._b = p;
        break;
      case 2:
        this._r = p;
        this._g = __v;
        this._b = t;
        break;
      case 3:
        this._r = p;
        this._g = q;
        this._b = __v;
        break;
      case 4:
        this._r = t;
        this._g = p;
        this._b = __v;
        break;
      case 5:
        this._r = __v;
        this._g = p;
        this._b = q;
        break;
      default:
        console.error(hi);
    }
  }

  public get r(): number {
    return this._r;
  }
  public set r(__value: number) {
    this._r = clamp(__value, 0, 255);
  } // { this._r = value & 0xff; }

  public get g(): number {
    return this._g;
  }
  public set g(__value: number) {
    this._g = clamp(__value, 0, 255);
  }

  public get b(): number {
    return this._b;
  }
  public set b(__value: number) {
    this._b = clamp(__value, 0, 255);
  }

  public get a(): number {
    return this._a;
  }
  public set a(__value: number) {
    this._a = clamp(__value, 0, 255);
  }

  public get h(): number {
    // Return Hue (0-360)
    const max: number = Math.max(this._r, this._g, this._b);
    const min: number = Math.min(this._r, this._g, this._b);

    if (max === min) {
      return this._h;
    } else if (this._r === max) {
      if (this._g > this._b) {
        return (60 * (this._g - this._b)) / (this._r - this._b);
      } else {
        return (60 * (6 - (this._b - this._g) / (this._r - this._g))) % 360;
      }
    } else if (this._g === max) {
      if (this._r > this._b) {
        return 60 * (2 - (this._r - this._b) / (this._g - this._b));
      } else {
        return 60 * (2 + (this._b - this._r) / (this._g - this._r));
      }
    } else {
      if (this._g > this._r) {
        return 60 * (4 - (this._g - this._r) / (this._b - this._r));
      } else {
        return 60 * (4 + (this._r - this._g) / (this._b - this._g));
      }
    }
  }

  public set h(__value: number) {
    // Set Hue (0-360)
    this._h = MathUtils.rangeMod(__value, 0, 360);

    this.setHSV(this._h, this.s, this.v);
  }

  public get s(): number {
    // Return HSV-compliant Saturation (0-1)
    const max: number = Math.max(this._r, this._g, this._b);
    const min: number = Math.min(this._r, this._g, this._b);
    if (max === min) {
      return 0;
    } else {
      return 1 - min / max;
    }
  }
  public set s(__value: number) {
    // Set HSV-style saturation (0-1)
    this.setHSV(this.h, clamp(__value), this.v);
  }

  public get v(): number {
    // Return Value (0-1)
    return Math.max(this._r, this._g, this._b);
  }

  public set v(__value: number) {
    // Set lightness (0-1)
    this.setHSV(this.h, this.s, clamp(__value));
  }
}
