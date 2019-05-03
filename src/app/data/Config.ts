import * as stripJsonComments from 'strip-json-comments';
import * as colorString from 'color-string';
//
// interface IStrings {
// 	[key: string]: string;
// }

// interface IAttractor {
//   files: string[];
//   loop: boolean;
//   delayHome: number;
//   delayBrand: number;
//   colorLight: string;
// }

// interface IInventory {
//   beverages: string[];
// }

//
// interface IBackend {
// 	type: Backends;
// 	extra: { [ key: string ]: any };
// }


export interface INutritionFact {
  calories: number;
  metricQuantity: number;
  metricUnits: string;
  nonMetricQuantity: number;
  nonMetricUnits: string;
}

interface INutritionFacts {
  nutritionFacts: INutritionFact[];
}

interface IBeverageNutritionFacts {
  [key: string]: INutritionFacts;
}


interface IConfig {
  nutritionFacts: IBeverageNutritionFacts;
}

type ProgressCallback = (filesLoaded: string[], filesLoading: string[]) => void;

/**
 * Holds configuration for the entire application; can also load it from a set of files
 */
export default class Config {

  private static _filesLoading: { [key: string]: Promise<any> } = {};
  private static _filesLoaded: { [key: string]: string } = {};

  private static _progressCallback?: ProgressCallback;
  private static _data: IConfig;


  constructor() {
  }


  public static async loadFrom(jsonFilename: string, substitutions?: { [key: string]: any }, progressCallback?: ProgressCallback) {
    this._progressCallback = progressCallback;
    const rawData = await this.loadFile(jsonFilename, substitutions);
    this._data = this.performConversions(rawData);
  }

  public static get() {
    return this._data;
  }


  private static async loadFile(filename: string, substitutions?: { [key: string]: any }): Promise<any> {
    if (this._filesLoaded[filename]) {
      return this._filesLoaded[filename];
    } else if (this._filesLoading[filename]) {
      return this._filesLoading[filename];
    } else {
      const fetchPromise = fetch(filename).then((response) => {
        return response.text();
      }).then((source) => {
        this._filesLoaded[filename] = source;
        delete this._filesLoading[filename];
        this.dispatchProgress();
        const fileContents = JSON.parse(stripJsonComments(source));
        if (substitutions) {
          // Replaces a file's content with another object's
          const substitutionKeys = Object.keys(substitutions);
          Object.keys(fileContents).forEach((key) => {
            if (substitutionKeys.includes(key)) fileContents[key] = substitutions[key];
          });
        }
        return this.parseObject(fileContents);
      }).catch((e) => {
        return Promise.reject({filename: e.filename ? e.filename : filename, error: e.error ? e.error : e});
      });

      this._filesLoading[filename] = fetchPromise;
      this.dispatchProgress();
      return fetchPromise;
    }
  }

  private static async parseObject(object: { [key: string]: any }): Promise<any> {
    // Search for JSON nodes inside the object and load them as needed

    const newObject: { [key: string]: any } = {};
    const promises: Promise<any>[] = [];

    for (const key of Object.keys(object)) {
      const subObject = object[key];
      if (typeof(subObject) === 'string' && subObject.endsWith('.json')) {
        newObject[key] = this.loadFile(subObject).then((response) => {
          newObject[key] = response;
          return response;
        });
        promises.push(newObject[key]);
      } else {
        newObject[key] = subObject;
      }
    }

    if (promises.length > 0) {
      return Promise.all(promises).then(() => {
        return newObject;
      });
    } else {
      return newObject;
    }
  }

  private static performConversions(data: any): IConfig {
    // Converts the original raw data to a valid IConfig shape
    let newData = this.convertFields(data, 'beverages.*.design.colors.*', this.colorFromString);
    newData = this.convertFields(newData, 'beverages.*.design.particlesHome.colors.*', this.colorFromString);
    newData = this.convertFields(newData, 'flavors.*.design.colors.*', this.colorFromString);
    return newData as IConfig;
  }

  private static convertFields(data: any, path: string, convertFunc: (val: any) => any): any {
    if (path === '') {
      // Reached the node
      return convertFunc(data);
    } else {
      // Will go deeper
      const splitPath = path.split('.');
      const firstNode = splitPath[0];
      const otherNodes = splitPath.slice(1).join('.');
      if (firstNode === '*') {
        // All sub-nodes
        let newData = Array.isArray(data) ? [...data] : {...data};
        const keys = Object.keys(newData);
        for (const key of keys) {
          newData[key] = this.convertFields(data[key], otherNodes, convertFunc);
        }
        return newData;
      } else {
        // A named sub-node
        const newData = {
          ...data,
          [firstNode]: this.convertFields(data[firstNode], otherNodes, convertFunc),
        };
        return newData;
      }
    }
  }

  private static colorFromString(color: string) {
    const obj = colorString.get.rgb(color);
    if (obj) {
      return (obj[0] << 16 | obj[1] << 8 | obj[2] | (obj[3] * 255) << 24) >>> 0;
    } else {
      console.warn(`Error: could not parse color ${color} as string`);
      return (0xffff00ff) >>> 0;
    }
  }

  private static dispatchProgress() {
    if (this._progressCallback) {
      this._progressCallback(Object.keys(this._filesLoaded), Object.keys(this._filesLoading));
    }
  }
}
