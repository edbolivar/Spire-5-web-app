import { QuadraticBezierCurve } from '../../utils/QuadraticBezierCurve';
import { DisplayObject } from 'pixi.js';
import { Color } from './Color';
import RandomGenerator from '../../utils/RandomGenerator';
import { PourableDesign } from '../../universal/app.types';

export class ParticleInfo {
  particle: DisplayObject;
  path: QuadraticBezierCurve;
  startTime: number;
  stopTime: number;
  startAngle: number;
  stopAngle: number;
  alpha: number;
  scale: number;
}

export function getParticleColor(beverage: PourableDesign): Color {
  let i: number;
  let totalWeight: number = 0;
 
  const list = beverage.design.particlesBrand;
 
  for (i = 0; i < list.length; i++) {
    totalWeight += list[i].frequency;
  }

  const randomNumber: number = totalWeight * Math.random();
  totalWeight = 0;

  for (i = 0; i < list.length; i++) {
    totalWeight += list[i].frequency;
    if (totalWeight >= randomNumber) {
      const colorVariation = list[i].colorVariation;

      const color: Color = Color.fromString(list[i].color);
      color.r += RandomGenerator.getInRange(-colorVariation, colorVariation) / 255;
      color.g += RandomGenerator.getInRange(-colorVariation, colorVariation) / 255;
      color.b += RandomGenerator.getInRange(-colorVariation, colorVariation) / 255;
      color.a = RandomGenerator.getInRange(list[i].opacityMin, list[i].opacityMax);
      
      return color;
    }
  }

  console.warn('Could not pick a color in ParticleInfo.getParticleColor');

  return Color.fromRRGGBB(0xff0000);
}
