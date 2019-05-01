
import * as moment from 'moment';
import * as shortid from 'shortid';
import * as _ from 'lodash';
import {ButtonModel} from './app.types';
import * as colorString from 'color-string';

export class JsUtil {
  static _objectIdSeed = 0 ;
  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static getObjectId() {
    return ++this._objectIdSeed;
  }

  static clone(objectToClone: any) {
    const contents = JSON.stringify(objectToClone);
    const newObj = JSON.parse(contents);
    return newObj;
  }

  static zeroPad(num, numZeros) {
    const n = Math.abs(num);
    const zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    let zeroString = Math.pow(10, zeros).toString().substr(1);

    if (num < 0) {
      zeroString = '-' + zeroString;
    }

    return zeroString + n;
  }

  static logPourConfig(brandButton: ButtonModel, flavorButtons: ButtonModel[]) {
    let flavors = '';
    _.forEach(flavorButtons, function(flavorButton: ButtonModel) {

      if (flavors.length > 0) {
        flavors += ', ';
      }

      flavors += flavorButton.Label ;
    });

    console.log(`Pour: ${brandButton.Label}\r\n  Flavors: ${flavors}`);
  }


  static formatSeconds(seconds: number) {
    // converts seconds to hhh:mm:ss
    const nseconds = Number(seconds) ;
    const h = Math.floor(nseconds / 3600);
    const m = this.zeroPad(Math.floor(nseconds % 3600 / 60), 2);
    const s = this.zeroPad(Math.floor(nseconds % 3600 % 60), 2);

    return `${h}:${m}:${s}`;
  }

  static generateId() {
    // it'd wrapped in case we decide to change implementation;
    return shortid.generate() ;
  }



  static extractDocTypeFromDocumentId(key: string) {

    return key ;
  }



  static mapToNewObject(sourceObject: any, targetObject: any): any {
    // ************************************************************
    // make sure your targetObject type definition has default
    // values for all properties, otherwise you will lose data
    // ************************************************************

    // used to make sure we have all the correct properties
    // and with the correct function prototypes
    // *** note if are you moving from a simple property to
    // a getter/setter, you'll have to handle it elsewhere

    if (!sourceObject) {
      return targetObject;
    }

    Object.keys(targetObject).forEach(function(propertyName) {
      // console.log('TargetObject ', propertyName,': ', targetObject[propertyName]);

      // if the property exists in the sourceObject, then we want to bring it across
      if (propertyName in sourceObject && sourceObject[propertyName] != null) {
          if ( targetObject[propertyName] instanceof Date) {
            targetObject[propertyName] = new Date(sourceObject[propertyName].toString()) ;
          } else {
            targetObject[propertyName] = sourceObject[propertyName];
          }
      }
    });

    return targetObject ;
  }

  static toColorNumber(colorAsString: string): number {
    return Number(colorAsString.replace('#', '0x'));
  }

  // NOT SURE WHY THIS EXISTS OR WHAT IT DOES
  // static colorFromString(color: string) {
  //   const obj = colorString.get.rgb(color);
  //   if (obj) {
  //     return (obj[0] << 16 | obj[1] << 8 | obj[2] | (obj[3] * 255) << 24) >>> 0;
  //   } else {
  //     console.warn(`Error: could not parse color ${color} as string`);
  //     return (0xffff00ff) >>> 0;
  //   }
  // }
}
