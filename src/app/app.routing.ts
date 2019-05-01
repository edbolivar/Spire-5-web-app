import { Routes, RouterModule } from '@angular/router';
import {ReferencesDemoComponent} from './diagnostics/references-demo/references-demo.component';
import {PubsubTesterComponent} from './diagnostics/pubsub-tester/pubsub-tester.component';
import {PixiContainerComponent} from './pixi-container/pixi-container.component';
import {BlockerComponent} from './controls/blocker/blocker.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/consumerui',  // change to /blocker for on line demo
    pathMatch: 'full'
  },
  {
    path: 'blocker',
    pathMatch: 'full',
    component: BlockerComponent
  },
  {
    path: 'home',
    pathMatch: 'full',
    component: ReferencesDemoComponent
  },
  {
    path: 'pubsub',
    component: PubsubTesterComponent
  },
  {
    path: 'consumerui',
    component: PixiContainerComponent
  }
];

export const appRoutingProviders: any[] = [

];

export const routing = RouterModule.forRoot(appRoutes);
