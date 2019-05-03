import {BrowserModule} from '@angular/platform-browser';
import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {appRoutingProviders, routing} from './app.routing';
import {AppComponent} from './app.component';
import {AppInfoService} from './services/app-info.service';
import {PubSubService} from './universal/pub-sub.service';
import {ReferencesDemoComponent} from './diagnostics/references-demo/references-demo.component';
import {ReactiveFormsModule} from '@angular/forms'
import {PubsubTesterComponent} from './diagnostics/pubsub-tester/pubsub-tester.component';
import {SocketClient} from './services/socket.client';
import { SignalRModule } from 'ng2-signalr';
import { SignalRConfiguration } from 'ng2-signalr';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { PixiContainerComponent } from './pixi-container/pixi-container.component';
import {ConfigurationService} from './services/configuration.service';
import {environment} from '../environments/environment';
import { PinpadComponent } from './controls/pinpad/pinpad.component';
import {UiButtonComponent} from './controls/ui-button/ui-button.component';
import {KeypadButtonStyleComponent} from './controls/ui-button/button-styles/keypad-button-style.component';
import {LocalizationService} from './services/localization.service';
import { BlockerComponent } from './controls/blocker/blocker.component';
import {ButtonPanelComponent} from './controls/button-panel/button-panel.component';
import {ComponentMappingService} from './services/component-mapping.service';


// https://github.com/HNeukermans/ng2-signalr
// v2.0.0

export function createConfig(): SignalRConfiguration {
  // read environment for socketURL
  const c = new SignalRConfiguration();
  c.hubName = 'SpirePlusHub';
  c.url = environment.urls.socket;
  c.logging = false;
  return c;
}
@NgModule({
  declarations: [
    AppComponent,
    ReferencesDemoComponent,
    PubsubTesterComponent,
    PixiContainerComponent,
    PinpadComponent,
    UiButtonComponent,
    BlockerComponent,
    KeypadButtonStyleComponent,
    ButtonPanelComponent
  ],
  entryComponents: [
    KeypadButtonStyleComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    SignalRModule.forRoot(createConfig)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    appRoutingProviders,
    AppInfoService,
    PubSubService,
    SocketClient,
    ConfigurationService,
    LocalizationService,
    ComponentMappingService
  ]
  ,

  bootstrap: [AppComponent]
})
export class AppModule {
}
