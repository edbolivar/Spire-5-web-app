export const environment = {
  production: true,
  siteName: 'ConsumerUI - Spire Plus',
  envfile: 'environment.spireplus.ts',
  serverPort: 4000,
  siteIconPath:  'assets/icons/spireplus.logo.png',
  urls: {
    socket: 'http://localhost:4002',
    visuals: 'http://localhost:4000/api/config/pocvisuals',
    serviceUI: 'http://localhost:4000/api/config/serviceui',
    platform: 'http://localhost:4000/api/config/design/platform2',
    flavors: 'http://localhost:4000/api/config/design/flavors',
    pouritems: 'http://localhost:4000/api/config/pouritems',
    idlestate: 'http://localhost:4000/api/config/idlestate',
    bubbles: 'http://localhost:4000/api/config/design/bubbles',
    animations: 'http://localhost:4000/api/config/design/animations',
    validatepin: 'http://localhost:4000/api/config/validatepin',
    pourables: 'http://localhost:4000/api/config/pourables',
    localization: 'http://localhost:4000/api/config/localization',
    home: 'http://localhost:4000/api/config/design/home',
    overrides: 'http://localhost:4000/api/config/overrides',
    unitstate: 'http://localhost:4000/api/config/unitstate'
  },
  isSocketDebug: false, 
  isConfigServiceDebug: false,
  serverHost: 'spireplus'
};
