import { Rectangle, Texture, Sprite } from "pixi.js";
import Box from "../display/shapes/Box";

interface RectangleSize {
  width: number;
  height: number;
}

export interface LayoutRectangleParams {
  left?: string | number;
  right?: string | number;
  width?: string | number;
  top?: string | number;
  bottom?: string | number;
  height?: string | number;
}

export function fitInsideRectangle(contentSize: RectangleSize, container: Rectangle, round: boolean = false): Rectangle {
  const containerRatio = container.width / container.height;
  const contentRatio = contentSize.width / contentSize.height;
  let newScale = 1;
  if (contentRatio > containerRatio) {
    // Video is longer than viewport, use width
    newScale = container.width / contentSize.width;
  } else {
    // Video is taller than viewport, use height
    newScale = container.height / contentSize.height;
  }

  const newWidth = contentSize.width * newScale;
  const newHeight = contentSize.height * newScale;

  const result = new Rectangle(
    (container.width - newWidth) / 2,
    (container.height - newHeight) / 2,
    newWidth,
    newHeight
  );

  if (round) {
    result.x = Math.round(result.x);
    result.y = Math.round(result.y);
    result.width = Math.round(result.width);
    result.height = Math.round(result.height);
  }

  return result;
}

export async function createImageToFit(rect: Rectangle, textureName: string): Promise<Sprite> {
  return new Promise<Sprite>((resolve) => {
    const result: Sprite = new Sprite();

    const setLogoScale = () => {
      const t = result.texture;
      const scaleX = rect.width / t.width;
      const scaleY = rect.height / t.height;
      const scale = Math.min(scaleX, scaleY);
  
      const newWidth = t.width * scale;
      const newHeight = t.height * scale;
      const offsetX = (rect.width - newWidth) / 2;
      const offsetY = (rect.height - newHeight) / 2;
  
      result.scale.set(scale, scale);
      result.position.set(
        rect.left + offsetX,
        rect.top + offsetY
      );

      if (result) {
        resolve(result);
      }
    };
  
    const texture = Texture.fromImage(textureName);
    result.texture = texture;
    result.position.set(rect.left, rect.top);
    
    if (texture.width > 1) {
      setLogoScale();
    } else {
      texture.on('update', setLogoScale);
    }
  });
}

/**
 * Convert a string unit to pixels
 */
export function parseLayoutRectangle(rect: LayoutRectangleParams, containerWidth: number, containerHeight: number, isAda: boolean = false, adaBottom: string = ''): Rectangle {
  const newRect = {
    left: parseUnits(rect.left, containerWidth, containerHeight),
    right: parseUnits(rect.right, containerWidth, containerHeight),
    width: parseUnits(rect.width, containerWidth, containerHeight),
    top: parseUnits(rect.top, containerWidth, containerHeight),
    bottom: parseUnits((isAda && adaBottom !== '') ? adaBottom : rect.bottom, containerWidth, containerHeight),
    height: parseUnits(rect.height, containerWidth, containerHeight),
  };

  // Recalculate where possible
  const h = refillDimensions(newRect.left, newRect.right, newRect.width, containerWidth);
  const v = refillDimensions(newRect.top, newRect.bottom, newRect.height, containerHeight);

  return new Rectangle(
    h.start,
    v.start,
    h.length,
    v.length
  );
}

/**
 * Refill dimensions where possible: for example, with left and right, return width
 */
function refillDimensions(start: number | null, end: number | null, length: number | null, total: number) {
  let newStart = start;
  let newEnd = end;
  let newLength = length;

  // Fill with best guesses
  if (start === null && end !== null && length !== null) { newStart = total - length - end; }
  if (end === null && start !== null && length !== null) { newEnd = total - length - start; }
  if (length === null && end !== null && start !== null) { newLength = total - start - end; }

  // Fill with fallbacks
  if (newStart === null) { newStart = 0; }
  if (newEnd === null) { newEnd = 0; }
  if (newLength === null) { newLength = total - newStart - newEnd; }

  return {
    start: newStart,
    end: newEnd,
    length: newLength,
  };
}

export function parseUnits(prop: string | number | undefined, containerWidth: number, containerHeight: number): number | null {
  if (typeof (prop) === 'number') {
    return prop;
  } else if (typeof (prop) === 'string' && prop.length !== 0) {
    const pu = prop.toLowerCase();
    const pn = parseFloat(prop);
    if (typeof (pn) === 'number') {
      if (pu.endsWith('vw')) { return pn / 100 * containerWidth; }
      if (pu.endsWith('vh')) { return pn / 100 * containerHeight; }
      if (pu.endsWith('px')) { return pn; }
      if (pu.endsWith('dp')) { return pn; } // TODO: add pixel scale calculation
      return pn;
    }
  }
  return null;
}

export default {
  fitInsideRectangle,
  parseLayoutRectangle,
  parseUnits,
};
