
import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule} from './app/app.module';
import 'hammerjs'; 

if (environment.production) {
  enableProdMode();
}

document.addEventListener('WebComponentsReady', () => {
  console.log(`=== Webcomponents Ready, Go Angular ===`);
  bootstrapNow();
});


function bootstrapNow() {
  // platformBrowserDynamic().bootstrapModule(AppModule);
  // we are not using zonejs and njzone
  platformBrowserDynamic().bootstrapModule(AppModule, {ngZone: 'noop'})
    .catch(err => console.log(err));

}


