export const environment = {
  production: true,
  siteName: 'ConsumerUI - AltSpire',
  envfile: 'environment.altspire.ts',
  serverPort: 4000,
  siteIconPath:  'assets/icons/altspire.logo.png',
  urls: {
    socket: 'http://localhost:4001',
    visuals: 'http://localhost:4000/api/config/pocvisuals',
    serviceUI: 'http://localhost:4000/api/config/serviceui',
    platform: 'http://localhost:4000/api/config/design/platform',
    flavors: 'http://localhost:4000/api/config/design/flavors',
    idlestate: 'http://localhost:4000/api/config/idlestate',
    bubbles: 'http://localhost:4000/api/config/design/bubbles',
    animations: 'http://localhost:4000/api/config/design/animations',
    validatepin: 'http://localhost:4000/api/config/validatepin',
    pourables: 'http://localhost:4000/api/config/pourables',
    localization: 'http://localhost:4000/api/config/localization',
    home: 'http://localhost:4000/api/config/design/home'
  },
  serverHost: 'altspire'
};
