import { Injectable,   HostListener } from '@angular/core';
import { JsUtil } from '../universal/JsUtil';
import { SubscribeEvent, PubSubTopic, PubSubEventArgs } from '../universal/pub-sub-types';
import { PourableDesign, Home } from '../universal/app.types';
import BrandBlobButton from '../pages/home/BrandBlobButton';
import { PublishEvent} from '../universal/pub-sub-types';
import MainMenu from '../pages/home/MainMenu';
import HomeScreen from '../pages/home/HomeScreen';
import BrandScreen from '../pages/brand/BrandScreen';
import FlavorList from '../pages/brand/FlavorList';
import { bind1 } from '../../../node_modules/@angular/core/src/render3/instructions';

@Injectable()
export class AdaNavigationService{
  objectId: number ;
  _Buttons: any[];
  _selectedButton: any;
  _orders: number[];
  _index: number;

  constructor() { 
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.AdaNavigationservice', this.objectId);

    SubscribeEvent.Create(PubSubTopic.notifyKeyEvent, this.objectId)
    .HandleEventWithThisMethod(e => {
      this.handleNotifyKeyEvent(e);
    })
    .Done();
  }

  
  handleNotifyKeyEvent(e: PubSubEventArgs){
    var eventArgs: PubSubEventArgs = e;
    var event: KeyboardEvent = eventArgs.data;
    if(HomeScreen._instance != null) {

      HomeScreen._instance.stopWaitingForAttractor();
      HomeScreen._instance.waitAndShowAttractor();
  
    } else if(BrandScreen._instance != null) {
      BrandScreen._instance.stopWaitingForAttractor();
      BrandScreen._instance.waitAndShowAttractor();
    }

    if (event.type == 'keyup') {
      if(event.key === 'ArrowRight') {
        
        this.increment();
      
      } else if(event.key === 'ArrowLeft') {

        this.decrement();
      
      } else if(event.key === 'ArrowUp') {

        if(BrandScreen._instance != null) {
          BrandScreen._instance.gotoHome();
        } else if(HomeScreen._instance != null) {
          HomeScreen._instance.toggleAdaStatus();
        }
      
      } else if (event.key === 'ArrowDown') {
      
        if(MainMenu._instance != null) {
          MainMenu._instance.dispatchSelectedBrand();
        } else if(BrandScreen._instance != null) {
         if(this._selectedButton._label.text != null) {
            console.log("flavor list");
            this._selectedButton.isSelected = !this._selectedButton.isSelected;
          }
        }
      
      } else if (event.key === 'Enter' && event.repeat === false) {
        if(BrandScreen._instance != null) {
          if(this._selectedButton._title.text != null) {
            this._selectedButton.onPointerUp();
            this._selectedButton.onClicked();
          }
        }
      } 

    } else if (event.type == 'keydown') {
      if(event.key === 'Enter') {
        if(BrandScreen._instance != null) {
          if(this._selectedButton._title.text != null) {
            this._selectedButton.onPointerDown();
          }
        }
      }
    }
  }
  
  setButtons(pourableButtons: any[]) {
    console.log('adaservice.setButtons', pourableButtons.length);
    this._Buttons = pourableButtons ;
    this._selectedButton = this._Buttons[0];
    this._index = 0;
    this._orders = [];
    for(let i = 0; i < this._Buttons.length; i++) {
      this._orders.push(i);
    }
  }

  appendButtons(pourableButtons: any[]) {
    if (this._Buttons.length == 0) {
      this.setButtons(pourableButtons);
    } else {
      pourableButtons.forEach(element => {
        this._Buttons.push(element);
        this._orders.push(this._Buttons.length - 1);
      });
    }
  }

  appendButton(pourableButton: any) {
    if (this._Buttons.length == 0) {
      this.setButtons([pourableButton]);
    } else {
      this._Buttons.push(pourableButton);
      this._orders.push(this._Buttons.length - 1);
    }
  }

  sortButtons() {
    this._orders.sort((b1, b2) => {
      if (this._Buttons[b1].y > this._Buttons[b2].y) {
        return 1;
      } else if (this._Buttons[b1].y < this._Buttons[b2].y) {
        return -1;
      } else {
        if (this._Buttons[b1].x > this._Buttons[b2].x) {
          return 1;
        } else if (this._Buttons[b1].x < this._Buttons[b2].x) {
          return -1;
        }
      }
      return 0;
    });

    let index = this._Buttons.indexOf(this._selectedButton);
    for(let i = 0; i < this._orders.length; i++) {
      if (index == this._orders[i]) {
        this._index = i;
        break;
      }
    }
    
  }

  public destroy() {
    console.log('AdaNavigationService.destroy');
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }

  
  releaseButtons() {
    console.log('adaservice.releaseButtons()');
    this._Buttons = [];
  }

  increment() {
    // let index = this._Buttons.indexOf(this._selectedButton); 
    if (this._index === this._Buttons.length - 1) {
      this._index = 0;
    } else {
      this._index++;
    } 
    console.log("selected right - " + this._index);
    this.changeSelected(this._index);
  }

  decrement() {

    // let index = this._Buttons.indexOf(this._selectedButton);
    if (this._index === 0) {
      this._index = this._Buttons.length - 1;
    } else {
      this._index--;
    }

    console.log("selected left - " + this._index);

    this.changeSelected(this._index);
  }

  changeSelected(nextIndex: number) { 
    // set isSelected off
    // this._selectedButton.pourable.pourItem.

    if (this._Buttons.length == 0) return;

    this._selectedButton = this._Buttons[this._orders[nextIndex]];

    PublishEvent.Create(PubSubTopic.notifyBrandButtonChangeSelected,this.objectId)
                .Send();

    // turn selected on
  }

}
