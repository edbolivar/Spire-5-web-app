export const environment = {
  production: true,
  siteName: 'ConsumerUI - Spire Plus',
  envfile: 'environment.prod.ts',
  serverPort: 4000,
  siteIconPath:  'assets/icons/spireplus.logo.png',
  urls: {
    socket: 'http://spire.oldprogrammer.io:4002',
    visuals: 'http://spire.oldprogrammer.io/api/config/pocvisuals',
    serviceUI: 'http://spire.oldprogrammer.io/api/config/serviceui',
    platform: 'http://spire.oldprogrammer.io/api/config/design/platform',
    flavors: 'http://spire.oldprogrammer.io/api/config/design/flavors',
    pouritems: 'http://spire.oldprogrammer.io/api/config/pouritems',
    idlestate: 'http://spire.oldprogrammer.io/api/config/idlestate',
    bubbles: 'http://spire.oldprogrammer.io/api/config/design/bubbles',
    animations: 'http://spire.oldprogrammer.io/api/config/design/animations',
    validatepin: 'http://spire.oldprogrammer.io/api/config/validatepin',
    pourables: 'http://spire.oldprogrammer.io/api/config/pourables',
    localization: 'http://spire.oldprogrammer.io/api/config/localization',
    home: 'http://spire.oldprogrammer.io/api/config/design/home'
  },
  serverHost: 'altspire',
  isBlocker: true
};
