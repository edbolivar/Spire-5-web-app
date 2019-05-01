
import MiniRouter from '../../../routing/MiniRouter';
import AbstractScreen from './AbstractScreen';
import HomeScreen from '../../pages/home/HomeScreen';
import BrandScreen from '../../pages/brand/BrandScreen';
import AttractorScreen from '../../pages/attractor/AttractorScreen';
import {AppInfoService} from '../../services/app-info.service';
import {PourableDesign} from '../../universal/app.types';
import * as _ from 'lodash';
import OutOfOrderScreen from '../../pages/out_of_order/OutOfOrderScreen';
import ScanPage from '../../pages/unattended/ScanPage';
import AuthenticatingPage from '../../pages/unattended/AuthenticatingPage';

export default class AppRoutes {

  private static _appInfo: AppInfoService;

  /* All routes used by the app */

  static createRouter(appInfo: AppInfoService) {

    this._appInfo = appInfo;

    const router = new MiniRouter<AbstractScreen>();

    router.addTemplate(AppRoutes.getHome(), () => {
      return new HomeScreen(this._appInfo);
    });

    const self = this;
    router.addTemplate(AppRoutes.getBrand(), (params: any) => {
      let foundPourable = _.find(self._appInfo.ConfigurationData.pourables.brands,
        item => params.brandId === item.id);

      if (foundPourable) {
        return new BrandScreen(foundPourable, this._appInfo);
      }

      foundPourable = _.find(self._appInfo.ConfigurationData.pourables.curatedMixes,
        item => params.brandId === item.id);

      if (foundPourable) {
        return new BrandScreen(foundPourable, this._appInfo);
      }

      return new BrandScreen(new PourableDesign(), this._appInfo);
    });

    router.addTemplate(AppRoutes.getAttractor(), () => {
      return new AttractorScreen(this._appInfo);
    });

    router.addTemplate(AppRoutes.getOutOfOrder(), (params: any, nonUriParam: any) => {
      return new OutOfOrderScreen(this._appInfo, nonUriParam);
    });
    router.addTemplate(AppRoutes.getScanPage(), () => {
      return new ScanPage(this._appInfo);
    });
    router.addTemplate(AppRoutes.getAuthenticatingPage(), () => {
      return new AuthenticatingPage(this._appInfo);
    });

    return router;
  }

  // All routes

  static getHome() {
    return '/home';
  }

  static getAttractor() {
    return '/attractor';
  }

  static getBrand(brandId?: string) {
    if (brandId) {
      return `/brand/${brandId}`;
    } else {
      return `/brand/${MiniRouter.PARAMETER_BRACKET_START}brandId${MiniRouter.PARAMETER_BRACKET_END}`;
    }
  }

  static getOutOfOrder() {
    return `/outOfOrder`;
  }
  static getScanPage() {
    return `/scanPage`;
  }
  static getAuthenticatingPage() {
    return `/authenticatingPage`;
  }
}
