import Sprite = PIXI.Sprite;
import ticker = PIXI.ticker;
import AbstractScreen from '../../display/navigation/AbstractScreen';
import LiquidVideo from './LiquidVideo';
import BlobButton from '../../display/components/BlobButton';
import FlavorList from './FlavorList';
import BlobShape from '../../display/shapes/BlobShape';
import CalorieInfo from './CalorieInfo';
import Fween from '../../../transitions/fween/Fween';
import LayoutUtils from '../../utils/LayoutUtils';
import StringUtils from '../../utils/StringUtils';
import AppRoutes from '../../display/navigation/AppRoutes';
import {AppInfoService} from '../../services/app-info.service';
import {FlavorDesign, PourableDesign, PourEventArgs, PourItem, IdleState, ConfigurationData, Home} from '../../universal/app.types';
import {JsUtil} from '../../universal/JsUtil';
import {LocalizationService} from '../../services/localization.service';
import {PublishEvent, PubSubTopic, SubscribeEvent} from '../../universal/pub-sub-types';
import * as _ from 'lodash';
import FlavorMix from './FlavorMix';
import BrandBlobButton from '../home/BrandBlobButton';
import {Texture} from 'pixi.js';
import LegacyAnimatedSprite from '../../display/components/LegacyAnimatedSprite';
import {Text} from 'pixi.js';
import TextUtils from '../../utils/TextUtils';
import HomeScreen from '../home/HomeScreen';


export default class BrandScreen extends AbstractScreen {

  private _beverage: PourableDesign;
  private _brandId: string;
  private _liquidVideo: LiquidVideo;
  private _pourButton: BlobButton;
  private _flavorList: FlavorList;
  private _liquidBackground: Sprite;
  private _bigBubbleMask: BlobShape;
  private _bigBubbleStroke: BlobShape;
  private _backButton: BlobButton;
  private _logo: Sprite;
  private _stroke: BlobShape;
  private _gradient: Sprite;
  private _gradientMask: BlobShape;
  private _animation: LegacyAnimatedSprite;
  private _calorieInfo: CalorieInfo;
  private _idleState: IdleState;
  private _dismissTimer;
  private _buttonAda: BlobButton;
  private _labelTouch1: Text;
  private _labelTouch2: Text;

  objectId: number;

  private _flavorMix: FlavorMix;
  private _topPadding: number = 0;

  private __isAda: boolean = false;

  constructor(pourable: PourableDesign, public appInfo: AppInfoService) {
    super(appInfo);
    this.objectId = JsUtil.getObjectId();
    this._beverage = pourable;

    // Bindings
    this.onTick = this.onTick.bind(this);

    this._brandId = this._beverage.id;
    this.visible = false;
    const self = this ;

    this._topPadding = this._beverage.isMix ? 300 : 0;

    this.__isAda = HomeScreen._isAda;

    SubscribeEvent.Create(PubSubTopic.configurationDataReady, this.objectId)
    .HandleEventWithThisMethod((e) => self.onDataReady(e.data))
    .Done();
    this._labelTouch1 = new Text("TOUCH HERE TO", TextUtils.getStyleBody(36, 0xff197af1));
    this._labelTouch2 = new Text("RETURN TO FULL SCREEN", TextUtils.getStyleBody(46, 0xff197af1));

  }

  onDataReady(e: ConfigurationData) {
    this._idleState = e.idleState;
 }


  public prepare(): Promise<void> {
    const vw = this.Platform.width;
    const vh = this.Platform.height;
    if(!this.__isAda)
    {
      this.createLiquidBackground(this._beverage, vw, vh);
 
      this.createLiquidVideo(this._beverage, vw, vh);

      this.createNutritionFacts(this._beverage, vw, vh);

      this.createBigBubble(this._beverage, vw, vh);
      this.createBackButton(this._beverage, vw, vh);
      this.createPourButton(this._beverage, vw, vh);
      this.createLogo(this._beverage, vw, vh);
      if (this._beverage.isMix) {
        this.createFlavorsMix(this._beverage, vw, vh);
      } else {
        this.createFlavorsList(this._beverage, vw, vh);
        this.createAnimation(this._beverage, vw, vh);
      }
    } else {

      this.createNutritionFacts(this._beverage, vw, vh);
      this.createBackButton(this._beverage, vw, vh);
      this.createPourButton(this._beverage, vw, vh);
      this.createLogo(this._beverage, vw, vh);
      this.createAdaButton(vw, vh);
      this.createNavLabel(vw,vh);
      if (this._beverage.isMix) {
        this.createFlavorsMix(this._beverage, vw, vh);
      } else {
        this.createFlavorsList(this._beverage, vw, vh);
        this.createAnimation(this._beverage, vw, vh);

      }
      
    }
    // Initial settings
    this.visible = false;

    this.interactive = true;
    this.on('pointermove', this.onPointerMove.bind(this));

    // Start animation
    ticker.shared.add(this.onTick);
    if(!this.__isAda)
    {
      var preparelist = this._beverage.isMix ?
      [
        this._liquidVideo.prepare(),
        this._flavorMix.prepare(),
        this._calorieInfo.prepare()
      ]
      : 
      [
        this._liquidVideo.prepare(),
        this._flavorList.prepare(),
        this._calorieInfo.prepare()
      ] ;
     }// else {
    //   var preparelist = this._beverage.isMix ?
    //   [
    //     this._flavorMix.prepare(),
    //     this._calorieInfo.prepare()
    //   ]
    //   : 
    //   [
    //     this._flavorList.prepare(),
    //     this._calorieInfo.prepare()
    //   ] ;
    // }
    return Promise.all(preparelist).then(() => {
      return;
    });
  }

  public show(previousRoute?: string): Promise<void> {
    return new Promise((resolve) => {
      this.alpha = 0;
      this.visible = true;
      if(!this.__isAda) {
        this._liquidVideo.play();
      }
      Fween
        .use(this)
        .to({alpha: 1}, 0.3)
        .call(() => {
          this.waitAndShowAttractor();
          resolve();
        }).play();
    });
  }

  public hide(nextRoute?: string): Promise<void> {
    this.stopWaitingForAttractor();
    return new Promise((resolve) => {
      Fween
        .use(this)
        .to({alpha: 0}, 0.3)
        .call(resolve).play();
    });
  }

  public destroy() {

    this.stopWaitingForAttractor();
    ticker.shared.remove(this.onTick);
    if(!this.__isAda)
    {
      this._bigBubbleMask.destroy();
      this._bigBubbleStroke.destroy();
      this._liquidVideo.destroy();
      this._backButton.destroy();
      this._pourButton.destroy();

      this._liquidBackground.destroy();    
      this._calorieInfo.destroy();
      this._logo.destroy();

      if (this._beverage.isMix) {
        this._flavorMix.destroy();
      } else {
        this._flavorList.destroy();
        this._animation.destroy();

      }

    } else {
      this._backButton.destroy();
      this._pourButton.destroy();

      this._calorieInfo.destroy();
      this._logo.destroy();
      this._buttonAda.destroy();
      this._labelTouch1.destroy();
      this._labelTouch2.destroy();

      if (this._beverage.isMix) {
        this._flavorMix.destroy();
      } else {
        this._flavorList.destroy();
        this._animation.destroy();
      }
    }
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
    super.destroy();
  }

  private onFlavorsChanged(selectedFlavorIds: string[]) {
    //Backend.get().setFlavors(selectedFlavorIds);
  }

  private onTick(delta: number) {
    if(!this.__isAda) {
      console.log("ADA STATE:"+this.__isAda);    
      const rotationSpeed = 0.004;
      this._bigBubbleMask.rotation += rotationSpeed * delta;
      this._bigBubbleStroke.rotation -= rotationSpeed * delta;
       }
    }

  private onPointerMove() {
    if (this.visible) {
      this.waitAndShowAttractor();
    }
  }

  private createBigBubble(beverage: PourableDesign, vw: number, vh: number) {

    const options = this.Platform.layout.brandBubble;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    const randomSeed = StringUtils.quickNumericHash(this._brandId);
    const radius = (dimensions.width + dimensions.height) / 4;
    if(!this.__isAda) {
      this._bigBubbleMask = new BlobShape(radius, 0xff000000, 0x00000000, 0, 0.06, undefined, undefined, undefined, randomSeed);
      this._bigBubbleMask.x = dimensions.left + dimensions.width / 2;
      this._bigBubbleMask.y = dimensions.top + dimensions.height / 2;
      this.addChild(this._bigBubbleMask);

      this._bigBubbleStroke = new BlobShape(radius, 0x00000000, JsUtil.toColorNumber(beverage.design.colors.strokeHome), 5, 0.06, undefined, undefined, undefined, randomSeed + 1);
      this._bigBubbleStroke.x = dimensions.left + dimensions.width / 2;
      this._bigBubbleStroke.y = dimensions.top + dimensions.height / 2;
      this.addChild(this._bigBubbleStroke);

      this._liquidBackground.mask = this._bigBubbleMask;
      this._liquidVideo.mask = this._bigBubbleMask;
    }
  }
  private createNavLabel(vw: number, vh:number) {
    const options = this.Platform.layout.homeButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    this._labelTouch1.anchor.set(0.5, 0.5);
    this._labelTouch1.x = vw/2;
    this._labelTouch1.y = vh/5;
    this._labelTouch2.anchor.set(0.5, 0.5);
    this._labelTouch2.x = vw/2;
    this._labelTouch2.y = vh/5 + this._labelTouch1.height;
    this.addChild(this._labelTouch1);
    this.addChild(this._labelTouch2);
    // this._labelTouch1.add(()=>{
    //   HomeScreen._isAda = !HomeScreen._isAda;
    //   this.navigator.goTo(AppRoutes.getHome());
    // })
  }
  
  private createAdaButton(vw: number, vh: number) {
    const options = this.Platform.layout.homeButtonAda;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const radius = dimensions.width ? dimensions.width / 2 : (dimensions.height ? dimensions.height / 2 : 0);
    this._buttonAda = new BlobButton(null, null, radius, 0xff197af1, 0xffffffff, 'assets/ui/icon_ada.png', 1, 0xff197af1, false);
    this._buttonAda.x = radius + (dimensions.right || 0)+this._backButton.radius*2;
    this._buttonAda.y = radius + (dimensions.top || 0);
    this._buttonAda.strokeFrontBackground = (this.__isAda) ? 0xff197af1 : 0xffffffff;
    this._buttonAda.iconColor = (this.__isAda) ? 0xffffffff : 0xff197af1;

    this.addChild(this._buttonAda);
    this._buttonAda.onPressed.add(() => {
      HomeScreen._isAda = !HomeScreen._isAda;
      this.navigator.goTo(AppRoutes.getHome());
    });
  }

    createLiquidBackground(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandLiquidBackground;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._liquidBackground = Sprite.fromImage(beverage.design.assets.liquidBackground);
    this._liquidBackground.x = dimensions.left;
    this._liquidBackground.y = dimensions.top;
    this._liquidBackground.width = dimensions.width;
    this._liquidBackground.height = dimensions.height;
    this.addChild(this._liquidBackground);
  }

  private createAnimation(beverage: PourableDesign, vw: number, vh: number) {

    // should get from configuration.
    const anim = this.appInfo.ConfigurationData.animations[31];

    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._animation = new LegacyAnimatedSprite(anim.image, anim.frameWidth, anim.frameHeight, anim.frames, anim.fps, anim.scale);
    this._animation.loop = true;
    this._animation.x = dimensions.width + dimensions.left - anim.frameWidth / 2 * anim.scale;
    if(!this.__isAda) {
      this._animation.y = dimensions.top + this._topPadding + anim.frameHeight / 2 * anim.scale;
    } else {
      this._animation.y = dimensions.top + this._topPadding + anim.frameHeight * anim.scale ;
    }
    this._animation.height = anim.height.valueOf();
    this._animation.scale.set(anim.scale, anim.scale);
    this.addChild(this._animation);
    this._animation.play();

  }

  private createLiquidVideo(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandLiquid;
    console.log(beverage);
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._liquidVideo = new LiquidVideo([beverage.design.assets.liquidIntro, beverage.design.assets.liquidIdle]);
    this._liquidVideo.x = dimensions.left;
    this._liquidVideo.y = dimensions.top;
    this._liquidVideo.width = dimensions.width;
    this._liquidVideo.height = dimensions.height;
    this.addChild(this._liquidVideo);
  }

  private createFlavorsList(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorList = new FlavorList(beverage.flavors, 3, this.appInfo);
    this._flavorList.x = dimensions.left;
    if(!this.__isAda) {
      this._flavorList.y = dimensions.top + this._topPadding;
    } else{
      this._flavorList.y = dimensions.bottom+ this._topPadding + vh/2;
    }
    this._flavorList.onChanged.add(this.onFlavorsChanged.bind(this));
    this.addChild(this._flavorList);
  }

  private createFlavorsMix(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandFlavors;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

    this._flavorMix = new FlavorMix(beverage, this.appInfo);
    this._flavorMix.x = dimensions.left;
    if(!this.__isAda)
    {
      this._flavorMix.y = dimensions.top + this._topPadding;
    } else {
      this._flavorMix.y = dimensions.top - this._topPadding/2 + vh/2;
    }
    this.addChild(this._flavorMix);
  }

  private createBackButton(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandButtonBack;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const title = LocalizationService.LocalizeString('brand.back.title');
    const radius = dimensions.width / 2;

    this._backButton = new BlobButton(undefined, title, radius, 0xff197af1, 0xffffffff, 'assets/ui/arrow-back.png', 0.12, 0xbbbbbb, false);
    this._backButton.x = radius + dimensions.left;
    this._backButton.y = radius + dimensions.top;
    this._backButton.onTapped.add(() => {
      this.navigator.goTo(AppRoutes.getHome());
    });
    this.addChild(this._backButton);
  }

  private createPourButton(beverage: PourableDesign, vw: number, vh: number) {
    const options = this.Platform.layout.brandButtonPour;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    const preTitle = LocalizationService.LocalizeString('brand.pour.preTitle');
    const title = LocalizationService.LocalizeString('brand.pour.title');
    const radius = dimensions.width / 2;

    if(!this.__isAda) {
      this._pourButton = new BlobButton(preTitle, title, radius, JsUtil.toColorNumber(beverage.design.colors.strokeHome), 0x11ffffff, 'assets/ui/arrow-pour.png', 0.32);
    } else {
      this._pourButton = new BlobButton(preTitle, title, radius, JsUtil.toColorNumber(beverage.design.colors.strokeHome), 0x11ffffff, 'assets/ui/arrow-pour.png', 0.32);      
    }

    this._pourButton.x = radius + dimensions.left;
    this._pourButton.y = radius + dimensions.top;
    this._pourButton.onPressed.add(this.startPour.bind(this));
    this._pourButton.onReleased.add(this.stopPour.bind(this));
    this.addChild(this._pourButton);
  }

  private createLogo(beverage: PourableDesign, vw: number, vh: number) {
    const uniqueId = beverage.id;
    const logoAsset = beverage.design.assets.logoHome;
    const gradientAsset = beverage.design.assets.gradient;
    const strokeColor = JsUtil.toColorNumber(beverage.design.colors.strokeHome);

    const options = this.Platform.layout.brandLogo;
    const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);
    console.log(dimensions);

    //mask
    this._gradient = new Sprite(Texture.fromImage(gradientAsset));
    this._gradient.anchor.set(0.5, 0.5);
    this._gradient.x = dimensions.left + dimensions.width / 2;
    if(!this.__isAda) {
       this._gradient.y = dimensions.top + dimensions.height / 2 + this._topPadding;
      }else if(this.__isAda && this._beverage.isMix) {
       this._gradient.y = dimensions.top - dimensions.height / 2 + vh/2 + this._topPadding/2;
      } else {
        this._gradient.y = dimensions.top - dimensions.height / 2 + this._topPadding + vh/2;
      }
    this.addChild(this._gradient);

    const randomSeed = StringUtils.quickNumericHash(uniqueId);
    this._gradientMask = new BlobShape(BrandBlobButton.ASSUMED_RADIUS, 0xff000000, 0x00000000, 0, 0.2, undefined, undefined, undefined, randomSeed);
    this._gradientMask.x = dimensions.left + dimensions.width / 2;
    if(!this.__isAda) {
      this._gradientMask.y = dimensions.top + dimensions.height / 2 + this._topPadding;
    }else if(this.__isAda && this._beverage.isMix) {
      this._gradientMask.y = dimensions.top - dimensions.height / 2 + vh/2 + this._topPadding/2;
    } else {
      this._gradientMask.y = dimensions.top - dimensions.height / 2 + this._topPadding + vh/2;
    }
    this._gradient.mask = this._gradientMask;
    this.addChild(this._gradientMask);
    
    //Logo
    this._logo = Sprite.fromImage(this._beverage.isMix ? beverage.design.assets.logoBrand : beverage.design.assets.logoBrand);
    
    console.log(this._logo.width);
    this._logo.anchor.set(0.5, 0.5);
    this._logo.scale.set(0.5, 0.5);
    this._logo.x = dimensions.left + dimensions.width / 2;
    if(!this.__isAda) {
      this._logo.y = dimensions.top + dimensions.height/2 + this._topPadding;
    }else if(this.__isAda && this._beverage.isMix) {
      this._logo.y = dimensions.top - dimensions.height / 2 + vh/2 + this._topPadding/2;
    } else {
      this._logo.y = dimensions.top - dimensions.height/2 + this._topPadding + vh/2;
    }
    this.addChild(this._logo);

    //stroke
    this._stroke = new BlobShape(BrandBlobButton.ASSUMED_RADIUS * 1.03 - 3, 0x00000000, (0xff000000 | strokeColor) >>> 0, 3, 0.2, undefined, undefined, undefined, randomSeed + 1);
    this._stroke.x = dimensions.left + dimensions.width / 2;
    if(!this.__isAda) {
      this._stroke.y = dimensions.top + dimensions.height / 2 + this._topPadding;
    } else if(this.__isAda && this._beverage.isMix) {
      this._stroke.y = dimensions.top - dimensions.height / 2 + vh/2 + this._topPadding/2;
    } else {
      this._stroke.y = dimensions.top - dimensions.height / 2 + this._topPadding + vh/2;
    }
    this.addChild(this._stroke);

  }

  // private createNutritionFacts(beverage: PourableDesign, vw: number, vh: number) {
  //   const options = this.Platform.layout.container;
  //   const dimensions = LayoutUtils.parseLayoutRectangle(options, vw, vh);

  //   this._calorieInfo = new CalorieInfo(beverage, dimensions);
  //   this.addChild(this._calorieInfo);
  // }

  private startPour() {

    if(!this._beverage.isMix){

      const flavors: PourItem[] = [];
      _.forEach(this._flavorList.selectedFlavors, function(flavorDesign: FlavorDesign) {
        flavors.push(flavorDesign.pourItem);
      });

      const pourArgs = new PourEventArgs(this._beverage.pourItem, flavors, this.objectId);
      console.log('sending start pour', pourArgs);

      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
      .SetDataArgumentTo(pourArgs)
      .Send();
      if(!this.__isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    } else {
      PublishEvent.Create(PubSubTopic.startPour, this.objectId)
      .Send();
      if(!this.__isAda) {
        this._liquidVideo.pouredTarget = 1;
      }
    }
  }

  private stopPour() {
    console.log('sending stop pour');
    PublishEvent.Create(PubSubTopic.stopPour, this.objectId)
      .Send();
      if(!this.__isAda) {
        this._liquidVideo.pouredTarget = 0;
      }
  }

  private waitAndShowAttractor() {

    this.stopWaitingForAttractor();
    this._dismissTimer = setTimeout((that) => {
      this.showAttractor();
    }, this._idleState.delayBrand * 1000);
  }

  private stopWaitingForAttractor() {
    clearInterval(this._dismissTimer);
  }

  private showAttractor() {
    clearInterval(this._dismissTimer);
    this.navigator.goTo(AppRoutes.getAttractor());
  }
}
