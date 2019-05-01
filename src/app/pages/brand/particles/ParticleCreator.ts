import { Sprite, Point } from 'pixi.js';
import { ParticleInfo, getParticleColor } from '../../../data/types/ParticleInfo';
import { ParticleCreatorFactory } from './ParticleCreatorFactory';
import { PourableDesign } from '../../../universal/app.types';
import { QuadraticBezierCurve } from '../../../utils/QuadraticBezierCurve';
import { Color } from '../../../data/types/Color';
import RandomGenerator from '../../../utils/RandomGenerator';
import { map } from '../../../../../node_modules/moremath';
import Easing from '../../../../transitions/Easing';
import { SharedGameLooper } from '../../../utils/GameLooper';
import { TextureLibrary } from '../../../display/TextureLibrary';
import Box from '../../../display/shapes/Box';

export class ParticleCreator extends Sprite {
  // Constant creator of particles

  // Properties
  private particlesPerSecond: number;
  private particlesSizeScale: number;
  private particlesSpeedScale: number;
  private beverageDesign: PourableDesign;

  private lastTimeCreatedParticle: number;

  private factory: ParticleCreatorFactory;

  // Instances
  private particles: ParticleInfo[];

  constructor(
    __factory: ParticleCreatorFactory,
    __particlesPerSecond: number,
    __particlesSizeScale: number,
    __particlesSpeedScale: number,
    __beverageDesign: PourableDesign
  ) {
    super();

    this.update = this.update.bind(this);

    this.factory = __factory;
    this.particlesPerSecond = __particlesPerSecond;
    this.particlesSizeScale = __particlesSizeScale;
    this.particlesSpeedScale = __particlesSpeedScale;
    this.beverageDesign = __beverageDesign;

    this.particles = [];

    SharedGameLooper.onTickedOncePerVisualFrame.add(this.update);
    this.lastTimeCreatedParticle = SharedGameLooper.currentTimeSeconds;
  }

  private createParticle(): void {
    // Find out where to create it

    // Create curve
    const curve: QuadraticBezierCurve = this.factory.createParticlePath();
    
    // const particleColor: Color = this.beverageDesign.getParticleBrandColor();
    const particleColor = getParticleColor(this.beverageDesign);

    const maxLife: number =
      (curve.length / 600) * 11 * RandomGenerator.getInRange(0.85, 1.15);

    // Create image
    const particle: Sprite = new Sprite(
      TextureLibrary.instance.getBlobParticlesTexture()
    );
    particle.tint = particleColor.toRRGGBB();
    this.addChild(particle);

    // Create sprite info
    const particleInfo: ParticleInfo = new ParticleInfo();
    particleInfo.particle = particle;
    particleInfo.startTime = SharedGameLooper.currentTimeSeconds;
    particleInfo.stopTime =
      SharedGameLooper.currentTimeSeconds + maxLife / this.particlesSpeedScale;
    particleInfo.startAngle = Math.random() * Math.PI * 2;
    particleInfo.stopAngle =
      particleInfo.startAngle + RandomGenerator.getInRange(-0.3, 0.3);
    particleInfo.scale =
      map(
        Easing.expoIn(Easing.quadIn(Math.random())),
        0,
        1,
        0.2,
        0.65
      ) * this.particlesSizeScale; // Small particles are more frequent than big ones // Was: expoIn
    particleInfo.alpha = particleColor.a;
    particleInfo.path = curve;
    this.particles.push(particleInfo);
  }

  private update(
    __currentTimeSeconds: number,
    __tickDeltaTimeSeconds: number,
    __currentTick: number
  ): void {
    const particleInterval: number = 1 / this.particlesPerSecond;

    // Create particles as needed
    while (this.lastTimeCreatedParticle <= __currentTimeSeconds - particleInterval) {
      this.createParticle();
      this.lastTimeCreatedParticle += particleInterval;
    }

    // Updates all particles, removing old ones
    let linearPhase: number;
    let inOutPhase: number;
    let p: Point;

    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].stopTime > __currentTimeSeconds) {
        // Just update
        linearPhase = map(
          __currentTimeSeconds,
          this.particles[i].startTime,
          this.particles[i].stopTime,
          0,
          1,
          true
        );
        inOutPhase =
          linearPhase < 0.5
            ? Easing.quadOut(linearPhase * 2)
            : 1 - Easing.none((linearPhase - 0.5) * 2); // quart in
        p = this.particles[i].path.getPointOnCurve(Easing.quadIn(linearPhase));
        this.particles[i].particle.x = p.x;
        this.particles[i].particle.y = p.y;
        this.particles[i].particle.alpha = inOutPhase * this.particles[i].alpha;

        const scale = this.particles[i].scale * linearPhase;
        this.particles[i].particle.scale.set(scale, scale);
        
        this.particles[i].particle.rotation = map(
          linearPhase,
          0,
          1,
          this.particles[i].startAngle,
          this.particles[i].stopAngle
        );
      } else {
        // Remove particle
        this.removeParticle(this.particles[i]);
        i--;
      }
    }
  }

  private removeParticle(__particleInfo: ParticleInfo): void {
    if (this.particles.indexOf(__particleInfo) > -1) {
      this.removeChild(__particleInfo.particle);
      // __particleInfo.particle.dispose();
      this.particles.splice(this.particles.indexOf(__particleInfo), 1);
    }
  }

  dispose(): void {
    SharedGameLooper.onTickedOncePerVisualFrame.remove(this.update);

    while (this.particles.length > 0) {
      this.removeParticle(this.particles[0]);
    }
  }
}
