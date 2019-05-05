import {JsUtil} from './JsUtil';
import { AnimationDefinition } from '../data/types/AnimationDefinition';

export class AppConfig {
  production: false;
  siteName: '';
  envfile: '';
  serverPort = 0;
  siteIconPath = '';
  urls: any = {};
  serverHost = '';
  // this sets up the security for the internet deployment, we default it to false
  // so this only get's admin'd in the prod file
  isBlocker = false;
}

export class ButtonType {
  static brand = 'brand' ;
  static flavor = 'flavor' ;
  static ice = 'ice' ;
  static water = 'water' ;
  static topCombination = 'topcombination' ;
  static action = 'action' ;
  static mix = 'mix';
  static valveAssignment = 'valveAssignment';
  static actionpanel = 'ActionPanel';
  static systempanel = 'SystemPanel';
  static manualIce = 'manualice' ;
  static autoPour = 'autopour' ;
  static manualPour = 'manualpour' ;
  static statebutton = 'statebutton' ;
}

export class ButtonState {
  static selected = 'selected' ;
  static available = 'available' ;
  static disabled = 'disabled' ;
  static hidden = 'hidden' ;
}

export class Gestures {
  static singletap = 'singletap' ;
  static doubletap = 'doubletap' ;
  static press = 'press' ;
  static pressUp = 'pressup' ;
  static allGestures = 'singletap doubletap press pressup' ;
}

export class PourEventArgs {
  pourMode = 'manualpour' ;
  constructor(public brand: PourItem, public flavors: PourItem[], public sender: number) {
  }
}

export class ButtonActions {
  static manualIce = 'manual.ice' ;
  static autoPour = 'auto.pour' ;
  static manualPour = 'manual.pour' ;
  static clearSelections = 'clear.selections' ;
}

// user_id, name, nickname, and picture
export interface DriveThruData {
  objectId: number ;
  brands: ButtonModel[];
  flavors: ButtonModel[];
  waters:  ButtonModel[];
  topCombinations: ButtonModel[] ;
  actions: ButtonModel[] ;
  curatedMixes: ButtonModel[];
}

export class PDMDataArg {
  constructor (public pdmtype: string, public data: any) {
  }
}

export class PDMDataType {
  static driveThruData = 'driveThruData';
  static serviceUIData = 'serviceUIData';
}

export class ButtonEventArgs {
  constructor(public gesture: string, public buttonModel: ButtonModel, public consumerObjectId: number) {
  }
}

export class ButtonSet {
  static topCombination = 'topCombination' ;
  static brand = 'brand' ;
  static flavor = 'flavor' ;
  static water = 'water' ;
  static ice = 'ice' ;
  static action = 'action' ;
  static mix = 'mix';
}

export class ScreenMetrics {


  buttonSize: string ;
  keypadButtonSize = '75px';

  buttonSizeFlavorShots: string ;
  flavorOnTopCombinationSize: string ;

  actionButtonWidth: string ;
  actionButtonHeight: string ;
  buttonImageHeight: string;
  buttonImageWidth: string;

  serviceActionButtonWidth: string;
  serviceActionButtonHeight: string;
  keypadWidth: string;
  keypadHeight: string;
}

export class ButtonEventData {
  // var data = {type:e.type, buttonModel:this.buttonModel, tag:e} ;
  constructor(public type: string, public buttonModel: ButtonModel, public viewModelObjectId, public tag?: any) {
  }
}

export class PourEventData {
  pourMode: string ;
}

export class PourMode {
  static optifill = 'optifill' ;
  static timedPour = 'timedPour' ;
  static isBrix = 'isBrix' ;
  static manualPour = 'manualPour' ;
}

export class StringKeyValuePair {
  key = '';
  value = '';
}

export class Platform {
  width: number;
  height: number;
  frameRate: number;
  layout: { [ key: string ]: any };
}

export class FlavorDesign {
  id = '';
  resourceId = '';
  name = '';
  pourItem: PourItem = new PourItem();
  design: FlavorDesignVisual = new FlavorDesignVisual();
  select: FlavorDesignDetail = new FlavorDesignDetail();
  spin: FlavorDesignDetail = new FlavorDesignDetail();
}

export class FlavorDesignVisual {
  textColor = 0;
  textSelectedColor = 0;
  backgroundColor = 0;
  alphaDisabled = 1.0;
}

export class FlavorDesignDetail {
  asset = '';
  width = 0;
  height = 0;
  frames = 0;
  fps = 0;
  scale = 0;
}

export class ConfigurationData {
  objectId: number;
  platform: Platform;
  flavors: FlavorDesign[] = [];
  idleState: IdleState = new IdleState();
  bubbles: AnimationDefinition = {
    id: 'bubbles',
    image: '', 
    frameWidth: 0, 
    frameHeight: 0, 
    frames: 0, 
    fps: 0, 
    scale: 1,
    autoPlay: false
  };
  animations: DesignAnimation[] = [];
  pourables: PourItemModel = new PourItemModel();
  localizedItems: ConsumerUILocalizationModel = new ConsumerUILocalizationModel();
  home: Home = new Home();
  constructor() {
    this.objectId = JsUtil.getObjectId();
  }
}

export class ResourceItem {
  name = '';
  url = '';
}

export class IdleState {
  videos: ResourceItem[] = [];
  loop = false;
  delayHome = 0;
  delayBrand = 0;
  colorLight = '';
}

export class Bubbles {
  asset = '';
  width = 0;
  height = 0;
  frames = 0;
  fps = 0;
  scale = 1;
}

export class CalorieCup {
  CupName = '';
  QtyInOunces = 0;
  QtyInMilliliters = 0;
  MetricLabel = '';
  NonMetricLabel = '';
  Line1Label = '';
  Line2Label = '';
}

export class PourableDesign {
  id = '';
  pourItem: PourItem = new PourItem();
  name = '';
  flavors: string[] = [];
  group = '';
  design: DesignNode = new DesignNode();
  Weighting = 0;
  CalorieCups: CalorieCup[] = [];
  // added for Mixology Pour Page by Eugene
  // isMix = false;
  // flavorShots: string[] = [];
  get isMix() {
    return this.id.startsWith('mix-');
  }
}


export class DesignNode {
  assets: DesignAssets = new DesignAssets();
  alphaCarbonation = 0;
  colors: DesignColors = new DesignColors();
  particlesHome: DesignParticles = new DesignParticles();
}


export class DesignAssets {
  logoHome = '';
  logoBrand = '';
  gradient = '';
  liquidIntro = '';
  liquidIdle = '';
  liquidBackground = '' ;
  mixName = '';
  bfConnector = '';

}

export class DesignColors {
  strokeHome = '';
  animationLight = '';
  animationDark = '' ;
}

export class DesignParticles {
  colors: string[] = [];
  opacity: DesignOpacity = new DesignOpacity();
}

export class DesignOpacity {
  from = 0 ;
  to = 0;
}

export class PourItemModel {
  brands: PourableDesign[] = [];
  waters: PourableDesign[] = [] ;
  topCombinations: PourableDesign[] = [] ;
  flavors: FlavorDesign[] = [];
  curatedMixes: PourableDesign[] = [];
  pourMenu: PourableDesign[] = [];
}

export class PourItem {
  id = '';
  pourConfigurationId = '';
  label = '';
  isDisabled = false ;
  brandId = '';
  flavorIds: string[] = [];
  isFocused = false ;
}

export class DesignParticleParentItem {
  x: number;
  y: number;
  radius: number;
  particleCount: number;
  designOpacity: DesignOpacity = new DesignOpacity();
  colors: string[] = [];
}

export class DesignAnimation {
  id = '' ;
  image = '';
  frameWidth = 0;
  frameHeight = 0;
  frames = 0;
  smoothing = '';
  fps = 0;
  scale = 1;
  format = 0;

  static getAnimationDefinition(animationId: string, animations: DesignAnimation[]): DesignAnimation {
    let i;
    for (i = 0; i < animations.length; ) {
      if (animations[i].id === animationId) {
        return animations[i];
      }
      i++;
    }

    return null;
  }

  get height(): Number {
    return this.frameHeight * this.scale;
  }
}

export class DesignMetaballItem {
  static metaballItems: DesignMetaballItem[] = [];
  designAnimationId = '';
  designAnimation: DesignAnimation;
  centerX = 0;
  centerY = 0;
  frequency = 1;
  angle = 0;
  scale = 1;

  static getMetaballItems(): DesignMetaballItem[] {
    if (this.metaballItems == null) {
      // this.metaballItems = this.fromXMLList((FountainFamily.homeXML.child("metaballs")[0] as XML).children());
    }
    return this.metaballItems;
  }

  get animation(): DesignAnimation {
    if (this.animation == null) {
      // this.animation = DesignAnimation.getAnimationDefinition(animationId,FountainFamily.animationDefinitions);
    }
    return this.animation;
  }
}

export class DesignSequenceItem {
  static DIRECTION_RIGHT = 'right';
  static sequenceItems: DesignSequenceItem[] = [];
  designAnimationId = '';
  designAnimation: DesignAnimation;
  centerX = 0;
  centerY = 0;
  frequency = 1;
  minTravelAngle = NaN;
  maxTravelAngle = NaN;
  minStartAngle = NaN;
  maxStartAngle = NaN;
  minEndAngle = NaN;
  maxEndAngle = NaN;
  alignWithTarget = false;
  flipOnAligning = false;
  rotationOffset = 0;
  travelBlobs = true;
  sameBlob = true;
  childBlob = true;
  heights: number[] = [];
  speeds: number[] = [];
  scales: number[] = [];
  restrictedBeverageIds: string[] = [];
  direction = 'right';
  playMetaballsStart = true;
  playMetaballsEnd = true;
  aboveTarget = false;
  startImpact = 0;
  endImpact = 0;
  avoidOverlap = false;
  avoidBleed = false;
  tinted = true;

  static getSequenceItems(): DesignSequenceItem[] {
    if (this.sequenceItems == null) {
      // this.sequenceItems = this.fromXMLList((FountainFamily.homeXML.child("sequences")[0] as XML).children());
    }
    return this.sequenceItems;
  }

  get isDirectionRight(): Boolean {
    return this.direction === 'right';
  }

  get animation(): DesignAnimation {
    if (this.animation == null) {
      // this.animation = DesignAnimation.getAnimationDefinition(animationId,FountainFamily.animationDefinitions);
    }
    return this.animation;
  }
}

export class ButtonModel {
  Id = '';
  ActionId = '' ;
  ObjectId: number ;
  Weighting = 0 ;
  ButtonState: string = ButtonState.available ;
  RecipeId = '' ;
  Label = '' ;
  ResourceId = '';
  PathToImage = '' ;
  PathToBackgroundImage = '' ;
  TextColor = '';
  TextSelectedColor = '';
  BackgroundColor = '';
  ButtonType = '' ;
  IsSelected = false ;
  IsVisible = true;
  IsDisabled = false;
  pressOnly = false ;
  gesture = '';
  payload: any = '';
  flavors: ButtonModel[] = [] ;
  ButtonModelList: ButtonModel[] = [];
  behaviors: string[] = [] ;
  Tag: any ;
  FooterColor = '';
  FooterFontColor = '';
  FooterText = '';
  FooterIcon = '';
  RowNumber = '';
  LegacyValves = '';
  UnitTypes = '';
  get pathToBackGroundImageAsUrl() {
    const outline = 'url(' + this.PathToBackgroundImage + ')' ;
    return outline ;
  }
  get isTapOnly(): boolean {
    return (this.behaviors.indexOf('tap') > -1 && this.behaviors.length === 1) ;
  }
  get isPressOnly(): boolean {
    return (this.behaviors.indexOf('press') > -1 && this.behaviors.length === 1) ;
  }
}


export class ItemStateInfo {
  ItemType = '';
  Description = '';
}

export class OutOfOrderEventArgs {
  Items: ItemStateInfo[]  = [];
  isOutOfOrder = false ;
}

export enum ItemStatus {
  None,
  Ok,
  Warning,
  Error
}

export class ConsumerUILocalizationModel {
  primaryLocalization: LocalizationResourceModel = new LocalizationResourceModel();
  secondaryLocalization: LocalizationResourceModel = new LocalizationResourceModel();
}

export class LocalizationResourceModel {
  Version = '';
  CountryLanguageCode = '';
  ResourceStrings: LocalizedItems = new LocalizedItems();

  getHasItems(): boolean {
    return Object.keys(this.ResourceStrings).length > 0;
  }
}

export class LocalizedItems {
  // key value pair
  // property name is key, value is localized string
  [key: string]: string;
}



export class Item {
  beverageId: string = '';
}

export class Menu {
  item: Item[] = [];
}

export class Metaball {
  animation: string = '';
  frequency: string = '';
  centerX: string = '';
  centerY: string = '';
  angle: string = '';
  scale: string = '';
}

export class Metaballs {
  metaball: Metaball[] = [];
}

export class PixiTextByResourceId {
  // key value pair
  // property name is key, PixiText object
  // to support localization
  [key: string]: PixiLocalizationItem;
}

export class PixiLocalizationItem {
  constructor(public resourceId: string, public pixiText: PIXI.Text, public objectIdOfConsumer: number) {

  }
}

export class Sequence {
  animation: string = '';
  frequency: string = '';
  centerX: string = '';
  centerY: string = '';
  travelBlobs: string = '';
  sameBlob: string = '';
  childBlob: string = '';
  direction: string = '';
  heights: string = '';
  speeds: string = '';
  minTravelAngle: string = '';
  maxTravelAngle: string = '';
  alignWithTarget: string = '';
  flipOnAligning: string = '';
  rotationOffset: string = '';
  scales: string = '';
  playMetaballsStart: string = '';
  playMetaballsEnd: string = '';
  aboveTarget: string = '';
  startImpact: string = '';
  endImpact: string = '';
  avoidOverlap: string = '';
  avoidBleed: string = '';
  tinted: string = '';
  minStartAngle: string = '';
  maxStartAngle: string = '';
  restrictedBeverageIds: string = '';
}

export class Sequences {
  sequence: Sequence[] = [];
}

export class Home {
  home: HomeData = new HomeData();
}

export class HomeData {
  menu: Menu = new Menu();
  metaballs: Metaballs = new Metaballs();
  sequences: Sequences = new Sequences();
}

export class ApiResult {
  Success = true;
  Message = '';
  Details: string[] = [];
  Url = '';
}

export enum KEY_CODE {
  RIGHT_ARROW = 39,
  LEFT_ARROW = 37,
  ONE = 49
}




