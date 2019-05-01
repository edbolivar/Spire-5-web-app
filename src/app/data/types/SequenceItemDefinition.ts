import { optionOrDefault } from "../../utils/optionOrDefault";
import { DesignAnimation } from "../../universal/app.types";
import { AppInfoService } from "../../services/app-info.service";

export class SequenceItemDefinition {
  // Constants
  static DIRECTION_LEFT: string = "left";
  static DIRECTION_RIGHT: string = "right";

  public animationId: string;
  public centerX: number;
  public centerY: number;
  public frequency: number;
  public minTravelAngle: number;
  public maxTravelAngle: number;
  public minStartAngle: number;
  public maxStartAngle: number;
  public minEndAngle: number;
  public maxEndAngle: number;
  public alignWithTarget: boolean;
  public flipOnAligning: boolean;
  public rotationOffset: number;
  public travelBlobs: boolean;
  public sameBlob: boolean;
  public childBlob: boolean;
  public heights: number[];
  public speeds: number[];
  public scales: number[];
  public restrictedBeverageIds: string[] = [];
  public direction: string;
  public playMetaballsStart: boolean;
  public playMetaballsEnd: boolean;
  public aboveTarget: boolean;
  public startImpact: number;
  public endImpact: number;
  public avoidOverlap: boolean;
  public avoidBleed: boolean;
  public tinted: boolean;

  private _animation: DesignAnimation;

  // ================================================================================================================
  // CONSTRUCTOR ----------------------------------------------------------------------------------------------------

  constructor(options: any) {
    this.animationId = optionOrDefault(options.animationId, "");
    this.centerX = optionOrDefault(options.centerX, 0);
    this.centerY = optionOrDefault(options.centerY, 0);
    this.minTravelAngle = optionOrDefault(options.minTravelAngle, NaN);
    this.maxTravelAngle = optionOrDefault(options.maxTravelAngle, NaN);
    this.minStartAngle = optionOrDefault(options.minStartAngle, NaN);
    this.maxStartAngle = optionOrDefault(options.maxStartAngle, NaN);
    this.minEndAngle = optionOrDefault(options.minEndAngle, NaN);
    this.maxEndAngle = optionOrDefault(options.maxEndAngle, NaN);
    this.alignWithTarget = optionOrDefault(options.alignWithTarget, false);
    this.flipOnAligning = optionOrDefault(options.flipOnAligning, false);
    this.rotationOffset = optionOrDefault(options.rotationOffset, 0);
    this.direction = optionOrDefault(
      options.direction,
      SequenceItemDefinition.DIRECTION_RIGHT
    );
    this.frequency = optionOrDefault(options.frequency, 1);
    this.travelBlobs = optionOrDefault(options.travelBlobs, true);
    this.sameBlob = optionOrDefault(options.sameBlob, true);
    this.childBlob = optionOrDefault(options.childBlob, true);
    this.heights = optionOrDefault(options.heights, []);
    this.speeds = optionOrDefault(options.speeds, []);
    this.playMetaballsStart = optionOrDefault(options.playMetaballsStart, true);
    this.playMetaballsEnd = optionOrDefault(options.playMetaballsEnd, true);
    this.aboveTarget = optionOrDefault(options.aboveTarget, false);
    this.startImpact = optionOrDefault(options.startImpact, 0);
    this.endImpact = optionOrDefault(options.endImpact, 0);
    this.avoidOverlap = optionOrDefault(options.avoidOverlap, false);
    this.avoidBleed = optionOrDefault(options.avoidBleed, false);
    this.tinted = optionOrDefault(options.tinted, true);
    this.scales = optionOrDefault(options.scales, [1, 1, 1]);
    this.restrictedBeverageIds = optionOrDefault(
      options.restrictedBeverageIds,
      []
    );
  }

  // ================================================================================================================
  // ACCESSOR INTERFACE ---------------------------------------------------------------------------------------------

  public get isDirectionRight(): boolean {
    return this.direction === SequenceItemDefinition.DIRECTION_RIGHT;
  }

  public get animation(): DesignAnimation {
    if (this._animation == null) {
      // Animation is unknown, tries to find it first
      this._animation = AppInfoService.instance.ConfigurationData.animations.find(
        a => a.id === this.animationId
      );

      if (this._animation == null) {
        console.error(`SequenceItemDefinition could not find animation '${this.animationId}'`);
      }
    }

    return this._animation;
  }
}

type SequenceItemDefinitionMap = {
  [id: string]: SequenceItemDefinition;
};

export const SequenceItemDefinitions: SequenceItemDefinitionMap = {
  menu_character_dudejump: new SequenceItemDefinition({
    animationId: "menu_character_dudejump",
    frequency: 1,
    centerX: 0.2421875,
    centerY: 0.046875,
    travelBlobs: true,
    sameBlob: false,
    childBlob: false,
    direction: SequenceItemDefinition.DIRECTION_RIGHT,
    heights: [0, 0.7, 0],
    speeds: [1, 0.2, 1],
    minTravelAngle: -40,
    maxTravelAngle: 40,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    scales: [1, 1.6, 1],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: false,
    avoidBleed: false,
    tinted: true
  }),
  menu_character_girlflip: new SequenceItemDefinition({
    animationId: "menu_character_girlflip",
    frequency: 1,
    centerX: -0.2109375,
    centerY: 0.03125,
    travelBlobs: true,
    sameBlob: true,
    childBlob: false,
    direction: SequenceItemDefinition.DIRECTION_RIGHT,
    heights: [0, 1, 0],
    speeds: [1, 0.1, 1],
    minTravelAngle: 0,
    maxTravelAngle: 45,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: false,
    avoidBleed: true,
    tinted: true
  }),
  menu_character_headspin: new SequenceItemDefinition({
    animationId: "menu_character_headspin",
    frequency: 1,
    centerX: -0.09411,
    centerY: 0.27058,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: SequenceItemDefinition.DIRECTION_RIGHT,
    heights: [0.5],
    speeds: [1, 0.1, 1],
    minStartAngle: -100,
    maxStartAngle: -80,
    alignWithTarget: true,
    flipOnAligning: false,
    rotationOffset: 0,
    scales: [1.4],
    playMetaballsStart: false,
    playMetaballsEnd: false,
    aboveTarget: true,
    startImpact: 0,
    endImpact: 0,
    avoidOverlap: false,
    avoidBleed: true,
    tinted: true
  }),
  menu_element_bike: new SequenceItemDefinition({
    animationId: "menu_element_bike",
    frequency: 1,
    centerX: -0.046875,
    centerY: 0.21875,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: SequenceItemDefinition.DIRECTION_RIGHT,
    heights: [0, 0.7, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.3,
    endImpact: 0.3,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: true
  }),
  menu_element_heart: new SequenceItemDefinition({
    animationId: "menu_element_heart",
    frequency: 1,
    centerX: -0.1875,
    centerY: 0.53125,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: SequenceItemDefinition.DIRECTION_RIGHT,
    heights: [0, 0.5, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: ["pepsi-diet"],
    playMetaballsStart: true,
    playMetaballsEnd: false,
    aboveTarget: false,
    startImpact: 0.3,
    endImpact: 0,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: true
  }),
  menu_element_headphones: new SequenceItemDefinition({
    animationId: "menu_element_headphones",
    frequency: 1,
    centerX: -0.109375,
    centerY: 0.0625,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: SequenceItemDefinition.DIRECTION_LEFT,
    heights: [0, 0.1, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: true,
    flipOnAligning: true,
    rotationOffset: -90,
    scales: [1.6],
    restrictedBeverageIds: ["pepsi"],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.3,
    endImpact: 0.2,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: true
  }),
  flavor_peach_select: new SequenceItemDefinition({
    animationId: "flavor_peach_select",
    frequency: 1,
    centerX: 0,
    centerY: 0,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-gala-la-la",
      "mix-shimmy-berry",
      "mix-peachy-green",
      "mix-sun-blossom"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_vanilla_select: new SequenceItemDefinition({
    animationId: "flavor_vanilla_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-kentucky-cream",
      "mix-midnight-fog",
      "mix-orchard-blush",
      "mix-darkelberry"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_lemon_select: new SequenceItemDefinition({
    animationId: "flavor_lemon_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-risky-blitz",
      "mix-hail-mary",
      "mix-southern-style",
      "mix-american-summer",
      "mix-gala-la-la",
      "mix-snazzberry",
      "mix-beach-ready",
      "mix-sun-blossom"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_strawberry_select: new SequenceItemDefinition({
    animationId: "flavor_strawberry_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-hail-mary",
      "mix-strawberry-fields",
      "mix-american-summer",
      "mix-orchard-blush",
      "mix-three-layer-berry",
      "mix-beach-ready",
      "mix-ruby-juicy",
      "mix-peachy-green"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_raspberry_select: new SequenceItemDefinition({
    animationId: "flavor_raspberry_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-perfect-spiral",
      "mix-midnight-fog",
      "mix-violet-twilight",
      "mix-three-layer-berry",
      "mix-snazzberry",
      "mix-shimmy-berry",
      "mix-ruby-juicy"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_lime_select: new SequenceItemDefinition({
    animationId: "flavor_lime_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-perfect-spiral",
      "mix-strawberry-fields",
      "mix-citrus-fiesta",
      "mix-zing-cherry"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  }),
  flavor_cherry_select: new SequenceItemDefinition({
    animationId: "flavor_cherry_select",
    centerX: 0,
    centerY: 0,
    frequency: 1,
    travelBlobs: false,
    sameBlob: true,
    childBlob: true,
    direction: "right",
    heights: [0, 0.3, 0],
    speeds: [1, 0.1, 1],
    minStartAngle: 0,
    maxStartAngle: 360,
    alignWithTarget: false,
    flipOnAligning: false,
    rotationOffset: 0,
    restrictedBeverageIds: [
      "mix-punt-play",
      "mix-dark-and-wild",
      "mix-violet-twilight",
      "mix-three-layer-berry",
      "mix-zing-cherry",
      "mix-gala-la-la",
      "mix-darkelberry",
      "mix-ruby-juicy",
      "mix-sun-blossom"
    ],
    playMetaballsStart: true,
    playMetaballsEnd: true,
    aboveTarget: false,
    startImpact: 0.75,
    endImpact: 1,
    avoidOverlap: true,
    avoidBleed: true,
    tinted: false
  })
};
