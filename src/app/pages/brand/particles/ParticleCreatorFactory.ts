import { QuadraticBezierCurve } from '../../../utils/QuadraticBezierCurve';

export interface ParticleCreatorFactory {
  createParticlePath: () => QuadraticBezierCurve;
}
