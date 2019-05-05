import { AnimationDefinition, AnimationDefinitions } from './AnimationDefinition';
import { optionOrDefault } from '../../utils/optionOrDefault';

export class MetaballItemDefinition {
  public animationId: string;
  public centerX: number;
  public centerY: number;
  public frequency: number;
  public angle: number;
  public scale: number;

  private _animation: AnimationDefinition;

  constructor(options: any) {
    this.animationId = optionOrDefault(options.animationId, '');
    this.centerX = optionOrDefault(options.centerX, 0);
    this.centerY = optionOrDefault(options.centerY, 0);
    this.frequency = optionOrDefault(options.frequency, 1);
    this.angle = optionOrDefault(options.angle, 0);
    this.scale = optionOrDefault(options.scale, 1);
  }

  public get animation(): AnimationDefinition {
    if (this._animation == null) {
      // Animation is unknown, tries to find it first
      this._animation = AnimationDefinitions[this.animationId];
    }

    return this._animation;
  }
}

type MetaballItemDefinitionMap = {
  [id: string]: MetaballItemDefinition;
};

export const MetaballItemDefinitions: MetaballItemDefinitionMap = {
  menu_metaballs_dudejump_1: new MetaballItemDefinition({
    animationId : 'menu_metaballs_dudejump_1',
    frequency: 1,
    centerX: 0.2,
    centerY: 0.6091954023,
    angle: -112.3,
    scale: 0.8
  }),
  menu_metaballs_dudejump_2: new MetaballItemDefinition({
    animationId : 'menu_metaballs_dudejump_2',
    frequency: 1,
    centerX: 0.12,
    centerY: 0.6179775281,
    angle: -109.4,
    scale: 0.8
  })
};
