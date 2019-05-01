import { Injectable,   HostListener } from '@angular/core';
import { JsUtil } from '../universal/JsUtil';
import { SubscribeEvent, PubSubTopic, PubSubEventArgs } from '../universal/pub-sub-types';
import { PublishEvent} from '../universal/pub-sub-types';
import MainMenu from '../pages/home/MainMenu';
import HomeScreen from '../pages/home/HomeScreen';
import BrandScreen from '../pages/brand/BrandScreen';
import { AppInfoService } from '../services/app-info.service';
import AppRoutes from '../display/navigation/AppRoutes';
import { IdleToHomeTransition } from '../display/navigation/IdleToHomeTransition';
import AttractorScreen from '../pages/attractor/AttractorScreen';

@Injectable()
export class AdaNavigationService {
  static __arrowUpProgressFlag = false;
  objectId: number ;
  _Buttons: any[];
  _selectedButton: any;
  _orders: number[];
  _index: number;
  _flavors: number;
  _dismissTimer;

  constructor() { 
    this.objectId = JsUtil.getObjectId();
    this._flavors = 0;
    SubscribeEvent.Create(PubSubTopic.notifyKeyEvent, this.objectId)
    .HandleEventWithThisMethod(e => {
      this.handleNotifyKeyEvent(e);
    })
    .Done();
  }

  handleNotifyKeyEvent(e: PubSubEventArgs) {
    if (!this._Buttons) {
      return ;
    }
    const leng = this._Buttons.length;
    const eventArgs: PubSubEventArgs = e;
    const event: KeyboardEvent = eventArgs.data;

    if (HomeScreen._instance != null) {
      HomeScreen._instance.stopWaitingForAttractor();
      HomeScreen._instance.waitAndShowAttractor();
  
    } else if (BrandScreen._instance != null) {
      BrandScreen._instance.stopWaitingForAttractor();
      BrandScreen._instance.waitAndShowAttractor();
    }

    if (event.type === 'keyup') {

      PublishEvent.Create(PubSubTopic.adaKeyPressed, this.objectId)
        .SetDataArgumentTo(true)
        .Send();

      if (event.key === 'ArrowRight') {
        this.increment();
      } else if (event.key === 'ArrowLeft') {
        this.decrement();
      } else if (event.key === 'ArrowUp') {        
        if (AdaNavigationService.__arrowUpProgressFlag) {
          return;
        }
        AdaNavigationService.__arrowUpProgressFlag = true;

        this._dismissTimer = setTimeout(() => {
          AdaNavigationService.__arrowUpProgressFlag = false;
        }, 2500);

       
        if (BrandScreen._instance != null) {
          if (AppInfoService.instance.isAda === false) {
            return;
          }
          
          BrandScreen._instance.gotoHome();
        } else if (HomeScreen._instance != null) {
          HomeScreen._instance.toggleAdaStatus();
        }      
      } else if (event.key === 'ArrowDown' && event.repeat === false) {
        this.seletedFlavors();
        if (MainMenu._instance != null && HomeScreen._instance.navigator.transitionProgress === 1) {
          MainMenu._instance.dispatchSelectedBrand();
        } else if (BrandScreen._instance != null && (MainMenu._instance == null || HomeScreen._instance.navigator.transitionProgress === 1)) {
         if (this._selectedButton !== this._Buttons[leng - 2] && this._selectedButton !== this._Buttons[leng - 1] && this._flavors < 3) {
            this._selectedButton.isSelected = !this._selectedButton.isSelected;
           } else if (this._selectedButton !== this._Buttons[leng - 2] && this._selectedButton !== this._Buttons[leng - 1] && this._flavors > 2) {
            if (this._selectedButton.isSelected === true) {
              this._selectedButton.isSelected = !this._selectedButton.isSelected;
            }
           } else if (this._selectedButton === this._Buttons[leng - 2] || this._selectedButton === this._Buttons[leng - 1]) {
              this._selectedButton.onPointerUp();
              this._selectedButton.onClicked();
           }
        }
      } else if (event.key === 'Enter') {
        if (BrandScreen._instance != null) {
          if (this._selectedButton !== this._Buttons[leng - 1]) {
            this._Buttons[leng - 2].onPointerUp();
            this._Buttons[leng - 2].onClicked();
          } else if (this._selectedButton === this._Buttons[leng - 1] || this._selectedButton === this._Buttons[leng - 2]) {
            this._Buttons[leng - 1].onPointerUp();
            this._Buttons[leng - 1].onClicked();
          }
        }
      } else if (event.key === 'CapsLock' || event.key === 'Clear') {
        if (AttractorScreen._instance != null) {          
          AppInfoService.instance.isAda = !AppInfoService.instance.isAda;
          AttractorScreen._instance.navigator.goTo(
            AppRoutes.getHome(),
            null,
            new IdleToHomeTransition());
          PublishEvent.Create(PubSubTopic.adaModeChanged, this.objectId)
          .SetDataArgumentTo(AppInfoService.instance.isAda)
          .Send();
        }
      }
    } else if (event.type === 'keydown') {
      if (event.key === 'Enter') {
        if (BrandScreen._instance != null) {
          if (this._selectedButton !== this._Buttons[leng - 1]) {

            let flavorCount = 0;
            for (let i = 0; i < leng - 2; i++) {
              if (this._Buttons[i].isSelected === true) {
                flavorCount++;
              }
            }
            if (flavorCount >= 0) {
              this._Buttons[leng - 2].onPointerDown();
            }
          } else if (this._selectedButton === this._Buttons[leng - 1] || this._selectedButton === this._Buttons[leng - 2]) {
            this._selectedButton.onPointerDown();
          }
        }
      } else if (event.key === 'ArrowDown') {
        if (BrandScreen._instance != null) {
          if (this._selectedButton === this._Buttons[leng - 2] || this._selectedButton === this._Buttons[leng - 1]) {
            this._selectedButton.onPointerDown();
          }
        }
      }
    }
  }
  
  setButtons(pourableButtons: any[]) {
    this._Buttons = pourableButtons ;
    this._selectedButton = this._Buttons[0];
    this._index = 0;
    this._orders = [];
    for (let i = 0; i < this._Buttons.length; i++) {
      this._orders.push(i);
    }
  }

  appendButtons(pourableButtons: any[]) {
    if (this._Buttons.length === 0) {
      this.setButtons(pourableButtons);
    } else {
      pourableButtons.forEach(element => {
        this._Buttons.push(element);
        this._orders.push(this._Buttons.length - 1);
      });
    }
  }

  appendButton(pourableButton: any) {
    if (this._Buttons.length === 0) {
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

    const index = this._Buttons.indexOf(this._selectedButton);
    for (let i = 0; i < this._orders.length; i++) {
      if (index === this._orders[i]) {
        this._index = i;
        break;
      }
    }
  }

  public destroy() {
    // won't get here, adanav service is an angular singleton
    SubscribeEvent.UnSubscribeByConsumer(this.objectId);
  }
  
  releaseButtons() {
    this._Buttons = [];
    this._selectedButton = null;
    this._orders = [];
  }

  increment() {
    if (this._index === this._Buttons.length - 1) {
      this._index = 0;
    } else {
      this._index++;
    } 
    this.changeSelected(this._index);
  }

  decrement() {
    if (this._index === 0) {
      this._index = this._Buttons.length - 1;
    } else {
      this._index--;
    }

    this.changeSelected(this._index);
  }

  changeSelected(nextIndex: number) { 
    // set isSelected off
    // this._selectedButton.pourable.pourItem.

    if (this._Buttons.length === 0) { return; }

    this._selectedButton = this._Buttons[this._orders[nextIndex]];

    PublishEvent.Create(PubSubTopic.notifyBrandButtonChangeSelected, this.objectId)
                .Send();
    // turn selected on
  }

  seletedFlavors() {
    this._flavors = 0;
    const leng =  this._Buttons.length;
    for (let i = 0; i < leng - 2; i++) {
      if (this._Buttons[i].isSelected === true) {
        this._flavors++;
      }
    }
  }
}
