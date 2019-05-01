import { Sprite } from 'pixi.js';
import BlobShape from '../../display/shapes/BlobShape';
import Prando from 'prando';
import { map } from 'moremath';
import { JsUtil } from '../../universal/JsUtil';
import { DesignParticleParentItem } from '../../universal/app.types';
import RandomGenerator from '../../utils/RandomGenerator';

export default class ParticleLayer extends Sprite {
  private _particles: BlobShape[];
  private _particleContainers: Sprite[];
  private _particleParentItems: DesignParticleParentItem[];
  private _rotationSpeed: number;
  private _scaleCycleTime: number;
  private _rotationOffset: number;

  constructor(particleParentItems: DesignParticleParentItem[]) {
    super();

    this.update = this.update.bind(this);

    // Initialize
    this._particleParentItems = particleParentItems;

    this._rotationSpeed = (RandomGenerator.getBoolean() ? 1 : -1) * RandomGenerator.getInRange(5, 18);
    this._scaleCycleTime = RandomGenerator.getInRange(4, 10);
    this._rotationOffset = Math.random();

    // Create
    this.createParticleContainers();
    this.createParticles();
  }

  public update(
    currentTimeSeconds: number,
    tickDeltaTimeSeconds: number,
    currentTick: number
  ) {
    this._particles.forEach((particle, index) => {
      particle.rotation = currentTimeSeconds * Math.PI * 2 / this._rotationSpeed;

      const scale = map(
        Math.sin((currentTimeSeconds + this._rotationOffset) / this._scaleCycleTime * Math.PI * 2), 
        -1,
        1, 
        1,
        1.5);
      particle.scale.set(scale);
    });
  }

  private createParticleContainers() {
    if (!this._particleContainers) {
      this._particleContainers = [];
      for (let i = 0; i < this._particleParentItems.length; i++) {
        const particleContainer = new Sprite();
        this.addChild(particleContainer);
        this._particleContainers.push(particleContainer);
      }
    }
  }

  private createParticles() {
    if (!this._particles) {
      const randomGenerator = new Prando();
      this._particles = [];

      // Create particles for each of the brand buttons
      for (let j = 0; j < this._particleParentItems.length; j++) {
        for (let i = 0; i < this._particleParentItems[j].particleCount; i++) {
          const radius = map(
            Math.pow(randomGenerator.next(0, 1), 3),
            0,
            1,
            this._particleParentItems[j].radius * 0.03,
            this._particleParentItems[j].radius * 0.18
          );
          const particlePosition = this.findBestParticlePosition(
            this._particleParentItems,
            this._particleParentItems[j],
            radius
          );

          if (particlePosition) {
            const color = JsUtil.toColorNumber(
              randomGenerator.nextArrayItem(this._particleParentItems[j].colors)
            );
            const particle = new BlobShape(
              radius,
              0xff000000 | color,
              0x000000,
              0,
              0.2,
              1,
              1
            );
            particle.x = particlePosition.x - this._particleParentItems[j].x;
            particle.y = particlePosition.y - this._particleParentItems[j].y;
            particle.alpha = randomGenerator.next(
              this._particleParentItems[j].designOpacity.from,
              this._particleParentItems[j].designOpacity.to
            );
            this._particleContainers[j].addChild(particle);
            this._particles.push(particle);
          }
        }
      }
    }
  }

  public setParticleContainerScale(index: number, scale: number) {
    // @@Jason,not enough particle containers
    if (index > this._particleContainers.length-1) {
      return ;
    }
    this._particleContainers[index].scale.set(scale, scale);
  }

  public setParticleContainerPosition(index: number, x: number, y: number) {
     // @@Jason,not enough particle containers
     if (index > this._particleContainers.length-1) {
      return ;
    }
    this._particleContainers[index].x = x;
    this._particleContainers[index].y = y;
  }

  public setParticleContainerAlpha(index: number, alpha: number) {
     // @@Jason,not enough particle containers
     if (index > this._particleContainers.length-1) {
      return ;
    }
    this._particleContainers[index].alpha = alpha;
  }

  private findBestParticlePosition(
    particleParentItems: DesignParticleParentItem[],
    anchorParticleParentItem: DesignParticleParentItem,
    expectedRadius: number
  ): DesignParticleParentItem | null {
    let timesTried = 0;
    while (timesTried < 5) {
      const radiusPos =
        anchorParticleParentItem.radius * 1.05 +
        expectedRadius +
        Math.random() * anchorParticleParentItem.radius * 0.1;
      const angle = Math.random() * Math.PI * 2;
      const x = anchorParticleParentItem.x + Math.cos(angle) * radiusPos;
      const y = anchorParticleParentItem.y + Math.sin(angle) * radiusPos;
      const particleParentItem = new DesignParticleParentItem();
      particleParentItem.x = x;
      particleParentItem.y = y;
      particleParentItem.radius = expectedRadius;
      if (
        !this.isParticleTooCloseToBlob(particleParentItem, particleParentItems)
      ) {
        return particleParentItem;
      }
      timesTried++;
    }
    return null;
  }

  private isParticleTooCloseToBlob(
    particleParentItem: DesignParticleParentItem,
    particleParentItems: DesignParticleParentItem[]
  ): boolean {
    for (const item of particleParentItems) {
      const dx = Math.abs(item.x - particleParentItem.x);
      const dy = Math.abs(item.y - particleParentItem.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < particleParentItem.radius + item.radius + 5) {
        return true;
      }
    }
    return false;
  }

  public destroy() {
    // Destroy the particles
    this._particles.forEach(particle => {
      particle.destroy();
    });

    // Destroy the particle sprite containers
    this._particleContainers.forEach(particleContainer => {
      particleContainer.destroy();
    });
  }
}
