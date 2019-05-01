import { Injectable } from '@angular/core';
import {AppInfoService} from './app-info.service';
import {JsUtil} from '../universal/JsUtil';
import {KeypadButtonStyleComponent} from '../controls/ui-button/button-styles/keypad-button-style.component';

@Injectable()
export class ComponentMappingService {
  objectId: number;
  mappings = {};

  constructor(appInfo: AppInfoService) {
    this.objectId = JsUtil.getObjectId();
    this.prepareMappings();
  }

  prepareMappings() {
    this.mappings['keypad'] = KeypadButtonStyleComponent;
  }

  getComponentType(typeNameAsString: string)  {
    if (this.mappings[typeNameAsString]) {
      return this.mappings[typeNameAsString];
    }

    console.log('component mapping not found', typeNameAsString);
    return null ;
  }
}

